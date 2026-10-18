export type ChatCategory = 'All' | 'Company' | 'Plant' | 'Head Office';
const categories: ChatCategory[] = ['All', 'Company', 'Plant', 'Head Office'];

export function ChatCategoryTabs({ active, onChange }: { active: ChatCategory; onChange: (value: ChatCategory) => void }) {
    return (
        <div className="flex gap-1 overflow-x-auto px-4 pb-3">
            {categories.map((item) => (
                <button
                    key={item}
                    onClick={() => onChange(item)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${active === item ? 'bg-slate-700 text-white' : 'bg-brand-aqua hover:bg-brand-gold text-slate-600'}`}
                >
                    {item}
                </button>
            ))}
        </div>
    );
}
