"""Stripe provider acceptance via authenticated CLI. Refuses live mode; no application DB writes."""
import json,os,subprocess,time,uuid,sys
from pathlib import Path
PROFILE='liceu-validation';ACCOUNT='acct_1TC9LbDLweZOOMDK'
ROOT=Path(__file__).resolve().parents[2]
STATE=ROOT/'.local-u00u05/stripe-sandbox-state.json'
REPORT=ROOT/'docs/implementation/STRIPE_SANDBOX_VERIFICATION.json'
state=json.loads(STATE.read_text()) if STATE.exists() else {'run_id':str(uuid.uuid4()),'resources':{},'checks':[]}
env=os.environ.copy();env.pop('STRIPE_API_KEY',None)
def save():
 STATE.write_text(json.dumps(state,indent=2)+'\n');STATE.chmod(0o600)
def api(resource,operation,*args,params=None,idempotency=None,allow_error=False):
 cmd=['stripe',*resource.split(),operation,*args,'--project-name',PROFILE,'--stripe-version','2024-06-20']
 for k,v in (params or {}).items():cmd+=['-d',k+'='+str(v).lower() if isinstance(v,bool) else k+'='+str(v)]
 if operation in ('cancel','expire'):cmd+=['--confirm']
 if idempotency:cmd+=['--idempotency',state['run_id']+'-'+idempotency]
 r=subprocess.run(cmd,capture_output=True,text=True,env=env,timeout=45)
 try:d=json.loads(r.stdout)
 except:
  if r.returncode==0 and operation in ('cancel','expire'):return api(resource,'retrieve',args[0])
  raise RuntimeError(f'{resource} {operation}: non-JSON response, exit {r.returncode}')
 if d.get('error') and not allow_error:raise RuntimeError(f"{resource} {operation}: {d['error'].get('code')} {d['error'].get('message')}")
 if 'livemode' in d:assert d['livemode'] is False,'LIVE MODE REJECTED'
 return d

def check(name,**details):
 if any(x['name']==name for x in state['checks']):return
 state['checks'].append({'name':name,'passed':True,**details});save();print('PASS: '+name,flush=True)
def remember(name,obj):state['resources'][name]=obj['id'];save();return obj
def obtain(name,resource,params):
 if name in state['resources']:return api(resource,'retrieve',state['resources'][name])
 return remember(name,api(resource,'create',params=params,idempotency=name))
def advance(clock,to):
 current=api('test_helpers test_clocks','retrieve',clock)
 if current['frozen_time']<to:api('test_helpers test_clocks','advance',clock,params={'frozen_time':to})
 for _ in range(60):
  d=api('test_helpers test_clocks','retrieve',clock)
  if d['status']=='ready':return
  if d['status']=='internal_failure':raise RuntimeError('Test clock internal failure')
  time.sleep(2)
 raise RuntimeError('Clock did not become ready')
def attach(customer,fixture):
 pm=api('payment_methods','attach',fixture,params={'customer':customer})
 api('customers','update',customer,params={'invoice_settings[default_payment_method]':pm['id']})
 return pm
try:
 account=api('get','/v1/account');assert account['id']==ACCOUNT
 assert api('balance','retrieve')['livemode'] is False
 check('Correct Liceu account and sandbox mode',account_id=ACCOUNT)
 if state.get('status')=='passed':
  print('Existing run already passed; no mutations repeated. Use a new state file for a fresh run.',flush=True);sys.exit(0)
 prices={}
 for kind,amount in [('monthly',79900),('review',19900),('mentoring',44900)]:
  product=obtain('product_'+kind,'products',{'name':'QA Liceu '+kind,'metadata[verification_run]':state['run_id']})
  params={'product':product['id'],'currency':'brl','unit_amount':amount}
  if kind=='monthly':params['recurring[interval]']='month'
  price=obtain('price_'+kind,'prices',params);assert price['unit_amount']==amount and price['currency']=='brl';prices[kind]=price['id']
 check('Sandbox catalog matches approved BRL amounts',prices=prices)
 # Session creation proves provider configuration, not completion of hosted Checkout UI.
 for kind,price in prices.items():
  session=obtain('checkout_'+kind,'checkout sessions',{'mode':'subscription' if kind=='monthly' else 'payment','line_items[0][price]':price,'line_items[0][quantity]':1,'payment_method_types[0]':'card','success_url':'https://example.invalid/success','cancel_url':'https://example.invalid/cancel','metadata[verification_run]':state['run_id']})
  assert session['status']=='open'
 check('Checkout sessions created for all three offers (not completed)')
 clock=obtain('clock','test_helpers test_clocks',{'frozen_time':int(time.time()),'name':'Liceu financial acceptance'})
 customer=obtain('customer','customers',{'test_clock':clock['id'],'name':'Synthetic Liceu acceptance','metadata[verification_run]':state['run_id']})
 if not any(x['name']=='Initial subscription payment succeeds' for x in state['checks']):
  attach(customer['id'],'pm_card_visa')
  sub=obtain('subscription','subscriptions',{'customer':customer['id'],'items[0][price]':prices['monthly'],'payment_behavior':'error_if_incomplete','metadata[verification_run]':state['run_id']})
  invoice=api('invoices','retrieve',sub['latest_invoice']);assert sub['status']=='active' and invoice['status']=='paid' and invoice['amount_paid']==79900
  state['initial_invoice']=invoice['id'];state['first_period_end']=sub['current_period_end'];save()
  check('Initial subscription payment succeeds',subscription_id=sub['id'],invoice_id=invoice['id'],amount_paid=invoice['amount_paid'])
 sub=api('subscriptions','retrieve',state['resources']['subscription'])
 if not any(x['name']=='Monthly renewal paid using Stripe test clock' for x in state['checks']):
  advance(clock['id'],state['first_period_end']+1)
  advance(clock['id'],state['first_period_end']+7200)
  sub=api('subscriptions','retrieve',sub['id']);invoice=api('invoices','retrieve',sub['latest_invoice'])
  assert sub['status']=='active' and invoice['status']=='paid' and invoice['id']!=state['initial_invoice'] and invoice['amount_paid']==79900
  check('Monthly renewal paid using Stripe test clock',invoice_id=invoice['id'],amount_paid=invoice['amount_paid'])
 sub=api('subscriptions','retrieve',state['resources']['subscription'])
 if not any(x['name']=='Failed renewal becomes past_due without payment' for x in state['checks']):
  attach(customer['id'],'pm_card_chargeCustomerFail')
  failure_at=sub['current_period_end'];advance(clock['id'],failure_at+1);advance(clock['id'],failure_at+7200)
  sub=api('subscriptions','retrieve',sub['id']);invoice=api('invoices','retrieve',sub['latest_invoice'])
  assert sub['status']=='past_due' and invoice['status']=='open' and invoice['amount_paid']==0
  check('Failed renewal becomes past_due without payment',subscription_status=sub['status'],invoice_status=invoice['status'])
 sub=api('subscriptions','retrieve',state['resources']['subscription'])
 if sub['status']!='canceled':sub=api('subscriptions','cancel',sub['id'],params={'invoice_now':False,'prorate':False})
 assert sub['status']=='canceled'
 check('Subscription canceled without extra invoice or proration')
 for kind,amount in [('review',19900),('mentoring',44900)]:
  pi=obtain('payment_'+kind,'payment_intents',{'amount':amount,'currency':'brl','payment_method':'pm_card_visa','payment_method_types[0]':'card','confirm':True,'metadata[verification_run]':state['run_id']})
  assert pi['status']=='succeeded' and pi['amount_received']==amount
  refund=obtain('refund_'+kind,'refunds',{'payment_intent':pi['id']});assert refund['status']=='succeeded' and refund['amount']==amount
  check(kind+' payment and full refund succeeded',payment_intent_id=pi['id'],refund_id=refund['id'],amount=amount)
 for kind in prices:api('checkout sessions','expire',state['resources']['checkout_'+kind])
 check('Uncompleted test Checkout sessions expired')
 state['status']='passed';state.pop('error',None)
except Exception as e:
 state['status']='failed';state['error']=str(e);save();print('FAILED: '+str(e),flush=True);raise
finally:
 save();REPORT.write_text(json.dumps({'scope':'Stripe API provider tests only; no production charges or application DB writes','account_id':ACCOUNT,'livemode':False,'status':state.get('status'),'checks':state['checks'],'resources':state['resources'],'error':state.get('error'),'limitations':['Hosted Checkout UI not completed','Application entitlement and webhook effects not asserted by this script']},indent=2)+'\n')
