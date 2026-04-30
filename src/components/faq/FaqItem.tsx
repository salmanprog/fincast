interface FaqItemProps {
  question: string;
  answer: string;
  open: boolean;
  onClick: () => void;
}

export default function FaqItem({ question, answer, open, onClick }: FaqItemProps) {
  return (
    <div className="border-b border-gray-300 py-4">
      <button
        className="w-full text-left flex justify-between items-center"
        onClick={onClick}
      >
        <h3 className="text-lg font-semibold">{question}</h3>
        <span className="text-xl">{open ? "-" : "+"}</span>
      </button>

      {open && (
        <p className="mt-2 text-gray-600 transition-all duration-300">
          {answer}
        </p>
      )}
    </div>
  );
}
