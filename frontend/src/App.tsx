import './App.css'

function App() {
  return (
    <div className="campfire-app">
      <header className="app-header">
        <span className="app-logo">🔥</span>
        <h1 className="app-title">Campfire</h1>
        <p className="app-tagline">
          Organize and enjoy music jam sessions with your friends
        </p>
      </header>

      <main className="app-main">
        <section className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon">🎸</span>
            <h2>Create Sessions</h2>
            <p>Start a jam session and invite your friends to join.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎵</span>
            <h2>Share Songs</h2>
            <p>Add songs to the queue and vote for your favorites.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🤝</span>
            <h2>Play Together</h2>
            <p>Enjoy music in sync with everyone around the campfire.</p>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Campfire — built with React + FastAPI</p>
      </footer>
    </div>
  )
}

export default App
