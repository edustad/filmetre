import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // LocalStorage'dan Kullanıcıları Çek (Başlangıçta tamamen boş dizi [])
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('filmetre_users');
    return saved ? JSON.parse(saved) : [];
  });

  // LocalStorage'dan Filmleri Çek (Başlangıçta tamamen boş dizi [])
  const [movies, setMovies] = useState(() => {
    const saved = localStorage.getItem('filmetre_movies');
    return saved ? JSON.parse(saved) : [];
  });

  // Aktif oturum açmış kullanıcı
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('filmetre_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Sayfa Yönlendirme Durumu: 'home' | 'detail' | 'profile'
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  // Giriş / Üye Ol Form State'leri
  const [authMode, setAuthMode] = useState('login'); // 'login' veya 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Profil - Film Ekleme Form State'leri
  const [selectedExistingId, setSelectedExistingId] = useState('new'); // 'new' veya film ID'si
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [score, setScore] = useState(10);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Değişiklikleri LocalStorage'a Kaydet
  useEffect(() => {
    localStorage.setItem('filmetre_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('filmetre_movies', JSON.stringify(movies));
  }, [movies]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('filmetre_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('filmetre_current_user');
    }
  }, [currentUser]);

  // Ortalama Puan Hesaplama Fonksiyonu
  const getAverageScore = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + Number(r.score), 0);
    return (sum / ratings.length).toFixed(1);
  };

  // Giriş Yap ve Üye Ol İşlemi
  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError('');

    const cleanUser = username.trim();
    if (!cleanUser || !password.trim()) {
      setAuthError('Lütfen kullanıcı adı ve şifre girin.');
      return;
    }

    if (authMode === 'register') {
      const exists = users.some(
        (u) => u.username.toLowerCase() === cleanUser.toLowerCase()
      );
      if (exists) {
        setAuthError('Bu kullanıcı adı zaten alınmış!');
        return;
      }
      const newUser = { username: cleanUser, password };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      setCurrentPage('home');
    } else {
      const found = users.find(
        (u) =>
          u.username.toLowerCase() === cleanUser.toLowerCase() &&
          u.password === password
      );
      if (!found) {
        setAuthError('Kullanıcı adı veya şifre hatalı!');
        return;
      }
      setCurrentUser(found);
      setCurrentPage('home');
    }

    setUsername('');
    setPassword('');
  };

  // Çıkış Yap
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
  };

  // Film Ekleme veya Var Olan Filme Puan Verme İşlemi
  const handleAddOrRateMovie = (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    const numericScore = Number(score);
    if (numericScore < 1 || numericScore > 10) {
      setFormMsg({ type: 'error', text: 'Puan 1 ile 10 arasında olmalıdır.' });
      return;
    }

    // 1. Durum: Yeni Film Ekleme
    if (selectedExistingId === 'new') {
      const cleanTitle = newMovieTitle.trim();
      if (!cleanTitle) {
        setFormMsg({ type: 'error', text: 'Lütfen film adını yazın.' });
        return;
      }

      // Film zaten sistemde var mı kontrol et
      const existingMovie = movies.find(
        (m) => m.title.toLowerCase() === cleanTitle.toLowerCase()
      );

      if (existingMovie) {
        setFormMsg({
          type: 'error',
          text: 'Bu film zaten listede var! Lütfen üstteki "Film Seçimi" menüsünden seçerek puanlayın.',
        });
        return;
      }

      const newMovie = {
        id: Date.now().toString(),
        title: cleanTitle,
        ratings: [{ username: currentUser.username, score: numericScore }],
      };

      setMovies([...movies, newMovie]);
      setNewMovieTitle('');
      setScore(10);
      setFormMsg({
        type: 'success',
        text: `"${cleanTitle}" eklendi ve ${numericScore} puan verildi!`,
      });
    } else {
      // 2. Durum: Listede Olan Bir Filme Puan Verme / Güncelleme
      const updatedMovies = movies.map((movie) => {
        if (movie.id === selectedExistingId) {
          const alreadyRated = movie.ratings.some(
            (r) => r.username === currentUser.username
          );

          let updatedRatings;
          if (alreadyRated) {
            updatedRatings = movie.ratings.map((r) =>
              r.username === currentUser.username
                ? { ...r, score: numericScore }
                : r
            );
          } else {
            updatedRatings = [
              ...movie.ratings,
              { username: currentUser.username, score: numericScore },
            ];
          }
          return { ...movie, ratings: updatedRatings };
        }
        return movie;
      });

      setMovies(updatedMovies);
      setFormMsg({
        type: 'success',
        text: 'Puanınız başarıyla kaydedildi!',
      });
    }
  };

  // --- EKRAN 1: KULLANICI GİRİŞ / ÜYE OL EKRANI ---
  if (!currentUser) {
    return (
      <div className="app-container">
        <div className="auth-wrapper">
          <div className="card auth-card">
            <h1 style={{ textAlign: 'center', color: '#f5c518', marginBottom: '20px' }}>
              🎬 Filmetre
            </h1>

            <div className="auth-tabs">
              <div
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
              >
                Giriş Yap
              </div>
              <div
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
              >
                Üye Ol
              </div>
            </div>

            {authError && <div className="msg-error">{authError}</div>}

            <form onSubmit={handleAuth}>
              <div className="form-group">
                <label>Kullanıcı Adı</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Kullanıcı adınızı girin..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Şifre</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Şifrenizi girin..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Başla'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Filmleri ortalama puana göre en yüksekten en düşüğe sırala
  const sortedMovies = [...movies].sort(
    (a, b) => Number(getAverageScore(b.ratings)) - Number(getAverageScore(a.ratings))
  );

  // Seçili filmin detay bilgisi
  const selectedMovie = movies.find((m) => m.id === selectedMovieId);

  // Aktif kullanıcının izlediği ve puanladığı filmler
  const myWatchedMovies = movies
    .filter((m) => m.ratings.some((r) => r.username === currentUser.username))
    .map((m) => {
      const myRating = m.ratings.find((r) => r.username === currentUser.username);
      return {
        ...m,
        myScore: myRating.score,
        avgScore: getAverageScore(m.ratings),
      };
    })
    .sort((a, b) => b.myScore - a.myScore);

  return (
    <div className="app-container">
      {/* ÜST MENÜ (NAVBAR) */}
      <nav className="navbar">
        <div className="logo" onClick={() => setCurrentPage('home')}>
          🎬 Filmetre
        </div>
        <div className="nav-links">
          <span className="user-badge">👤 {currentUser.username}</span>
          <button
            className={`btn ${currentPage === 'home' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentPage('home')}
          >
            Ana Sayfa
          </button>
          <button
            className={`btn ${currentPage === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setCurrentPage('profile');
              setFormMsg({ type: '', text: '' });
            }}
          >
            Profilim & Film Ekle
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </nav>

      {/* ANA İÇERİK */}
      <main className="main-content">
        {/* --- EKRAN 2: ANA SAYFA (EN YÜKSEK PUANLI FİLMLER) --- */}
        {currentPage === 'home' && (
          <div>
            <div className="section-title">
              <span>🏆 Filmetre Top Listesi (En Yüksek Puanlılar)</span>
            </div>

            {sortedMovies.length === 0 ? (
              <div className="empty-state">
                <p style={{ marginBottom: '15px' }}>
                  Henüz sisteme hiç film eklenmemiş. İlk filmi eklemek için profilinize gidin!
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentPage('profile')}
                >
                  + İlk Filmi Ekle
                </button>
              </div>
            ) : (
              <div className="movie-list">
                {sortedMovies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="movie-item"
                    onClick={() => {
                      setSelectedMovieId(movie.id);
                      setCurrentPage('detail');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="movie-rank">#{index + 1}</span>
                      <div>
                        <div className="movie-title">{movie.title}</div>
                        <div className="movie-meta">
                          {movie.ratings.length} kullanıcı oy verdi • Detaylar için tıklayın
                        </div>
                      </div>
                    </div>
                    <div className="score-badge">
                      ⭐ {getAverageScore(movie.ratings)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- EKRAN 3: FİLM DETAY EKRANI (KİM KAÇ PUAN VERMİŞ) --- */}
        {currentPage === 'detail' && selectedMovie && (
          <div>
            <button
              className="btn btn-secondary"
              style={{ marginBottom: '20px' }}
              onClick={() => setCurrentPage('home')}
            >
              ← Ana Sayfaya Dön
            </button>

            <div className="card" style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '26px', color: '#f5c518' }}>{selectedMovie.title}</h2>
                  <p style={{ color: '#aaa', marginTop: '5px' }}>
                    Toplam {selectedMovie.ratings.length} değerlendirme
                  </p>
                </div>
                <div className="score-badge" style={{ fontSize: '22px', padding: '10px 18px' }}>
                  ⭐ Ortalama: {getAverageScore(selectedMovie.ratings)}
                </div>
              </div>
            </div>

            <div className="section-title">
              <span>👥 Kullanıcı Puanları (En Yüksekten Düşüğe)</span>
            </div>

            <div className="movie-list">
              {[...selectedMovie.ratings]
                .sort((a, b) => b.score - a.score)
                .map((rating, idx) => (
                  <div key={idx} className="movie-item" style={{ cursor: 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="movie-rank">#{idx + 1}</span>
                      <span className="movie-title">👤 {rating.username}</span>
                    </div>
                    <div className="score-badge">⭐ {rating.score} / 10</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* --- EKRAN 4: PROFİLİM VE FİLM EKLEME EKRANI --- */}
        {currentPage === 'profile' && (
          <div className="profile-grid">
            {/* Sol Kısım: İzlediğim Filmler */}
            <div>
              <div className="section-title">
                <span>🎬 İzlediğim Filmler ({myWatchedMovies.length})</span>
              </div>

              {myWatchedMovies.length === 0 ? (
                <div className="empty-state">
                  Henüz izlediğiniz bir film eklemediniz. Sağdaki formdan hemen ekleyebilirsiniz!
                </div>
              ) : (
                <div className="movie-list">
                  {myWatchedMovies.map((movie, idx) => (
                    <div
                      key={movie.id}
                      className="movie-item"
                      onClick={() => {
                        setSelectedMovieId(movie.id);
                        setCurrentPage('detail');
                      }}
                    >
                      <div>
                        <div className="movie-title">
                          {idx + 1}. {movie.title}
                        </div>
                        <div className="movie-meta">
                          Genel Ortalama: ⭐ {movie.avgScore}
                        </div>
                      </div>
                      <div className="score-badge">
                        Senin Puanın: {movie.myScore}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sağ Kısım: Film Ekle / Puan Ver Formu */}
            <div>
              <div className="card">
                <h3 style={{ color: '#f5c518', marginBottom: '15px' }}>
                  + Film Ekle / Puan Ver
                </h3>

                {formMsg.text && (
                  <div className={formMsg.type === 'error' ? 'msg-error' : 'msg-success'}>
                    {formMsg.text}
                  </div>
                )}

                <form onSubmit={handleAddOrRateMovie}>
                  <div className="form-group">
                    <label>Film Seçimi</label>
                    <select
                      className="form-input"
                      value={selectedExistingId}
                      onChange={(e) => setSelectedExistingId(e.target.value)}
                    >
                      <option value="new">+ Listede Yok (Yeni Film Ekle)</option>
                      {movies.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} (Mevcut Ort: ⭐ {getAverageScore(m.ratings)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedExistingId === 'new' && (
                    <div className="form-group">
                      <label>Yeni Film Adı</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: Başlangıç (Inception)"
                        value={newMovieTitle}
                        onChange={(e) => setNewMovieTitle(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Puanınız (1 - 10 Arası)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Kaydet ve Puanla
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;