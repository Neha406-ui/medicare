export function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D9E4E2] bg-[#F9FBFB] px-4 py-12 text-center text-sm text-[#667085]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E9E7] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#F5F8F7] text-xs uppercase tracking-[0.08em] text-[#7B8893]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="border-t border-[#EEF2F1] text-sm text-[#263238]">
                {columns.map((column) => (
                  <td key={`${row.id || rowIndex}-${column.key}`} className="px-4 py-3 align-middle">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
