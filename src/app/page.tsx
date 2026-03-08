export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-red-600">TEST HOME PAGE</h1>
      <p className="text-xl mt-4">Se vedi questo, il sito funziona!</p>
      <div className="mt-8 p-6 bg-white border-2 border-blue-500 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Calendario Test</h2>
        <div className="grid grid-cols-7 gap-2 text-center">
          {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map(day => (
            <div key={day} className="p-3 bg-gray-100 rounded font-bold text-sm">
              {day}
            </div>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="p-3 border rounded text-sm bg-blue-100">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
