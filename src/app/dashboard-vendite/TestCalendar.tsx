"use client";

export default function TestCalendar() {
  return (
    <div className="p-4 border-2 border-red-500 bg-red-50">
      <h3 className="text-lg font-bold text-red-600">TEST CALENDARIO QUI</h3>
      <p>Se vedi questo, il componente si carica</p>
      <div className="mt-4 p-4 bg-white border rounded">
        <div className="grid grid-cols-7 gap-1 text-xs">
          {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map(day => (
            <div key={day} className="p-2 text-center font-semibold bg-gray-100 rounded">
              {day}
            </div>
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="p-2 text-center border rounded hover:bg-gray-50">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
