import { useEffect, useRef } from "react";
import "./Home.css";

const VIDEO_SRC = `${import.meta.env.BASE_URL}background.mp4`;
const POSTER_SRC = `${import.meta.env.BASE_URL}background.png`;

export function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const syncVideoMotion = () => {
      const video = videoRef.current;

      if (!video) {
        return;
      }

      if (motionPreference.matches) {
        video.pause();
        video.removeAttribute("autoplay");
        video.currentTime = 0;
        return;
      }

      void video.play().catch(() => {});
    };

    syncVideoMotion();
    motionPreference.addEventListener("change", syncVideoMotion);

    return () => {
      motionPreference.removeEventListener("change", syncVideoMotion);
    };
  }, []);

  return (
    <div className="hero">
      <div className="desk" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="nav" role="banner">
        <a className="brand" href="#home" aria-label="campfire">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">campfire</span>
        </a>

        <nav className="auth" aria-label="Conta">
          <a className="login" href="#entrar">
            entrar
          </a>
          <a className="signup" href="#criar-conta">
            criar conta
          </a>
        </nav>
      </header>

      <main id="home" className="page">
        <div className="holes" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="lines" aria-hidden="true" />
        <div className="stain" aria-hidden="true" />

        <div className="page-head">
          <span>caderno de setlist · vol. 01</span>
          <span className="date">terça, ~ tarde</span>
        </div>

        <h1 className="headline">
          as músicas que
          <br />
          <span className="underline">eu</span> ando tocando
          <br />
          em casa.
        </h1>
        <p className="sub">
          campfire é onde elas ficam guardadas e prontas para serem parte de uma
          jam session entre amigos.
        </p>

        <section className="setlist" aria-label="setlist">
          <div className="setlist-col">
            <div className="setlist-title">setlist de hoje:</div>
            <ul>
              <li>
                <span className="check" aria-hidden="true" />
                aprender a intro de rebirth
              </li>
              <li>
                <span className="check" aria-hidden="true" />
                treinar solo de santeria
              </li>
              <li>
                <span className="check" aria-hidden="true" />
                tirar black do pearl jam
              </li>
              <li>
                <span className="check" aria-hidden="true" />
                voltar amanhã
              </li>
            </ul>
          </div>
          <div className="setlist-col">
            <div className="setlist-title">próximas:</div>
            <ul className="next">
              <li>
                <b>01</b>aquela do strokes
              </li>
              <li>
                <b>02</b>a do dedilhado impossível
              </li>
              <li>
                <b>03</b>qualquer uma do radiohead
              </li>
            </ul>
          </div>
        </section>

        <figure className="polaroid">
          <span className="tape-strip tl" aria-hidden="true" />
          <span className="tape-strip tr" aria-hidden="true" />
          <div className="pic" aria-hidden="true">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              poster={POSTER_SRC}
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          </div>
          <figcaption className="cap">última jam com a galera</figcaption>
        </figure>

        <div className="colophon-row" aria-hidden="true">
          <span className="colophon">PG. 01 / ∞ · 2026</span>
        </div>
      </main>
    </div>
  );
}
