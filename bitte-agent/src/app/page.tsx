export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          register
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          deposit
        </button>
        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          swap and withdraw
        </button>
      </main>
    </div>
  );
}
