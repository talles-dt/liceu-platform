export default function sitemap() {
  const baseUrl = "https://www.oliceu.com";

  const staticPages = [
    "/",
    "/manifesto",
    "/metodo",
    "/programa",
    "/mentoria",
    "/blog",
    "/diagnostico",
    "/login",
    "/contato",
    "/privacidade",
    "/termos",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1 : route === "/blog" ? 0.8 : 0.6,
  }));

  return staticPages;
}
