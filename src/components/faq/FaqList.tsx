"use client";

import { useState } from "react";
import FaqItem from "./FaqItem";

interface FAQ {
  question: string;
  answer: string;
}

interface FaqListProps {
  faqs: FAQ[];
}

export default function FaqList({ faqs }: FaqListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="">
        <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
      {faqs.map((item, index) => (
        <FaqItem
          key={index}
          question={item.question}
          answer={item.answer}
          open={openIndex === index}
          onClick={() => toggleFaq(index)}
        />
      ))}
    </div>
  );
}
