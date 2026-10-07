import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function AdherenceChart({ data }) {
  return (
    <div className="h-[240px] w-full rounded-2xl border border-[#E4E9E7] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#263238]">Medication adherence</h3>
          <p className="text-xs text-[#667085]">Last 7 days</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="adherenceFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#4F8A8B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4F8A8B" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EAF0EF" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#667085' }} domain={[0, 100]} />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Adherence']}
            contentStyle={{ borderRadius: 12, border: '1px solid #E4E9E7' }}
          />
          <Area type="monotone" dataKey="adherence" stroke="#4F8A8B" fill="url(#adherenceFill)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
