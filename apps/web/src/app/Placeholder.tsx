import { FooterHairline } from "../ui/FooterHairline";
import { Nav } from "../ui/Nav";
import { PageColumn } from "../ui/PageColumn";
import "./Placeholder.css";

export function AppPlaceholder() {
  return (
    <div className="app-placeholder">
      <Nav action={null} />
      <PageColumn>
        <section className="app-placeholder__content" aria-labelledby="app-placeholder-title">
          <h1 id="app-placeholder-title">painel de controle (tbd)</h1>
        </section>
      </PageColumn>
      <FooterHairline />
    </div>
  );
}
