"use client";
import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import Image from "next/image";

// Tipado de película (evita "any")
type Movie = {
  id: string;
  title: string;
  year: number;
  genres?: string[];
  poster: string;
  hlsUrl: string;
  description: string;
};

// ---------- Datos de ejemplo ----------
const SAMPLE_MOVIES: Movie[] = [
  {
    id: "1",
    title: "Planeta Azul (Dominio público)",
    year: 1934,
    genres: ["Aventura", "Clásico"],
    poster:
      "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=800&auto=format&fit=crop",
    hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    description:
      "Documental clásico sobre los misterios de los océanos. Ejemplo para pruebas del reproductor.",
  },
  {
    id: "2",
    title: "Historias de Iquitos (CC)",
    year: 2020,
    genres: ["Drama", "Latinoamericana"],
    poster:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=800&auto=format&fit=crop",
    hlsUrl: "https://test-streams.mux.dev/ptsVOD/20190215.m3u8",
    description:
      "Relatos urbanos en la Amazonía peruana con licencia Creative Commons para demostración.",
  },
];

// ---------- Reproductor HLS ----------
function HlsPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      console.warn("HLS no soportado en este navegador.");
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        className="w-full h-full"
      />
    </div>
  );
}

// ---------- Tarjeta de película ----------
function MovieCard({
  movie,
  onPlay,
}: {
  movie: Movie;
  onPlay: (m: Movie) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition p-3 flex flex-col gap-3">
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl">
        <Image
          src={movie.poster}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <h3 className="text-lg font-semibold leading-tight">{movie.title}</h3>
        <div className="text-sm text-gray-600">
          {movie.year} • {movie.genres?.join(" · ")}
        </div>
        <p className="text-sm text-gray-700 line-clamp-2">
          {movie.description}
        </p>
      </div>
      <button
        onClick={() => onPlay(movie)}
        className="mt-auto px-4 py-2 rounded-xl bg-black text-white font-medium hover:opacity-90"
      >
        Ver ahora
      </button>
    </div>
  );
}

// ---------- Modal ----------
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl p-4 md:p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black text-white rounded-full w-9 h-9 grid place-items-center"
          aria-label="Cerrar"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ---------- Filtros ----------
function Filters({
  query,
  setQuery,
  genre,
  setGenre,
}: {
  query: string;
  setQuery: (v: string) => void;
  genre: string;
  setGenre: (v: string) => void;
}) {
  const genres = Array.from(
    new Set(SAMPLE_MOVIES.flatMap((m) => m.genres || []))
  ).sort();

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
      <div className="flex-1">
        <label className="text-sm font-medium">Buscar</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Título, año..."
          className="w-full mt-1 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      <div className="w-full md:w-64">
        <label className="text-sm font-medium">Género</label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full mt-1 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">Todos</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ---------- App principal ----------
export default function MovieApp() {
  const [movies] = useState<Movie[]>(SAMPLE_MOVIES);
  const [query, setQuery] = useState<string>("");
  const [genre, setGenre] = useState<string>("");
  const [current, setCurrent] = useState<Movie | null>(null);

  const filtered = movies.filter((m) => {
    const q = query.toLowerCase().trim();
    const matchesQuery =
      !q ||
      [m.title, String(m.year), ...(m.genres || [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    const matchesGenre = !genre || (m.genres || []).includes(genre);
    return matchesQuery && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black text-white grid place-items-center font-bold">
              PG
            </div>
            <h1 className="text-xl md:text-2xl font-bold">PaseGol Pelis</h1>
          </div>
          <nav className="hidden md:flex gap-4 text-sm text-gray-700">
            <a className="hover:underline" href="#">
              Inicio
            </a>
            <a className="hover:underline" href="#">
              Catálogo
            </a>
            <a className="hover:underline" href="#">
              Mi cuenta
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Explora</h2>
          <Filters
            query={query}
            setQuery={setQuery}
            genre={genre}
            setGenre={setGenre}
          />
        </section>

        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((m) => (
              <MovieCard key={m.id} movie={m} onPlay={setCurrent} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center text-gray-600 py-20">
              No hay resultados.
            </div>
          )}
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600">
          © {new Date().getFullYear()} PaseGol Pelis • Sólo contenido con
          derechos o de dominio público.
        </div>
      </footer>

      <Modal open={!!current} onClose={() => setCurrent(null)}>
        {current && (
          <div className="flex flex-col gap-4">
            <HlsPlayer src={current.hlsUrl} poster={current.poster} />
            <div>
              <h3 className="text-xl font-semibold">{current.title}</h3>
              <div className="text-sm text-gray-600">
                {current.year} • {current.genres?.join(" · ")}
              </div>
              <p className="mt-2 text-gray-800">{current.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
