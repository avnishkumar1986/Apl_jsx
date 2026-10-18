export interface ChatMessageData {
    id: number;
    text: string;
    time: string;
    mine?: boolean;
    sender?: string;
}

export function ChatMessage({ message }: { message: ChatMessageData }) {
    return (
        <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm ${message.mine ? 'rounded-br-sm bg-slate-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'}`}
            >
                {!message.mine && message.sender && <p className="mb-1 text-[11px] font-bold text-slate-700">{message.sender}</p>}
                <p className="text-[13px] leading-5">{message.text}</p>
                <p className={`mt-1 text-right text-[9px] ${message.mine ? 'text-white/70' : 'text-slate-400'}`}>{message.time}</p>
            </div>
        </div>
    );
}
