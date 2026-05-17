import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
    <div className="poster">
      <header className="poster-nav" role="banner">
        <span className="poster-brand" aria-label="campfire">
          campfire
        </span>

        <nav className="poster-actions" aria-label="Conta">
          <Link className="poster-link poster-link--secondary" to="/signin">
            entrar
          </Link>
          <Link className="poster-link poster-link--primary" to="/signup">
            criar conta
          </Link>
        </nav>
      </header>

      <main id="home" className="poster-main">
        <div className="poster-band" aria-hidden="true">
          <video
            ref={videoRef}
            className="poster-video"
            autoPlay
            muted
            loop
            playsInline
            poster={POSTER_SRC}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>

          <div className="poster-fx poster-fx--darken" />
          <div className="poster-fx poster-fx--halftone" />
          <div className="poster-fx poster-fx--scanlines" />
          <div className="poster-fx poster-fx--tracking" />
          <div className="poster-fx poster-fx--grain" />
          <div className="poster-fx poster-fx--vignette" />
        </div>

        <section className="poster-cap" aria-labelledby="poster-title">
          <h1 className="poster-headline" id="poster-title">
            guarde as músicas que você toca em casa.
          </h1>
          <p className="poster-copy">
            um repertório pessoal, quieto, para lembrar o que é seu antes da próxima roda.
          </p>
        </section>

        <footer className="poster-footer">
          <p className="poster-footer-text">alpha • coming soon</p>
        </footer>
      </main>
    </div>
  );
}
