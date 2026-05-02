CREATE OR REPLACE FUNCTION claim_and_process_purchase(
  p_purchase_id uuid,
  p_user_id text
) RETURNS json AS $$
DECLARE
  purchase_record RECORD;
  provision_success boolean := FALSE;
  record_success boolean := FALSE;
  processed boolean := FALSE;
BEGIN
  -- 1. Fetch and lock the purchase record (for update)
  SELECT * INTO purchase_record
  FROM pending_purchases
  WHERE id = p_purchase_id
    AND claimed = FALSE
  FOR UPDATE;

  -- If no record found, return early
  IF NOT FOUND THEN
    RETURN json_build_object(
      'processed', FALSE,
      'provisioned', FALSE,
      'recorded', FALSE,
      'error', 'Purchase not found or already claimed'
    );
  END IF;

  -- 2. Provision course access if applicable
  IF purchase_record.course_id IS NOT NULL THEN
    BEGIN
      PERFORM ensure_course_progress_for_user_admin(p_user_id, purchase_record.course_id);
      provision_success := TRUE;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to provision course % for user %: %', 
                    purchase_record.course_id, p_user_id, SQLERRM;
    END;
  END IF;

  -- 3. Record the purchase
  BEGIN
    PERFORM record_purchase_admin(
      p_user_id,
      purchase_record.kind,
      purchase_record.stripe_session_id,
      NULL,
      NULL
    );
    record_success := TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to record purchase % for user %: %', 
                  p_purchase_id, p_user_id, SQLERRM;
  END;

  -- 4. Mark as claimed only if both steps succeeded
  IF provision_success AND record_success THEN
    UPDATE pending_purchases
    SET claimed = TRUE,
        claimed_at = NOW(),
        claimed_by_user_id = p_user_id
    WHERE id = p_purchase_id;
    processed := TRUE;
  END IF;

  -- Return detailed result
  RETURN json_build_object(
    'processed', processed,
    'provisioned', provision_success,
    'recorded', record_success
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;