import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <main className="flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Racing Game
          </h1>
          <p className="text-xl text-gray-300 max-w-md">
            Challenge yourself to achieve the maximum distance while avoiding obstacles!
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <Link
            href="/game"
            className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Start Game
          </Link>

          <Link
            href="/vehicle-select"
            className="px-12 py-4 bg-gray-700 hover:bg-gray-600 text-white text-lg font-medium rounded-lg transition-colors"
          >
            Customize Vehicle
          </Link>

          <Link
            href="/leaderboard"
            className="px-12 py-4 bg-yellow-600 hover:bg-yellow-700 text-white text-lg font-medium rounded-lg transition-colors"
          >
            🏆 Leaderboard
          </Link>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Use ← → arrow keys to move</p>
          <p>Collect power-ups and avoid obstacles</p>
        </div>
      </main>
    </div>
  );
}
