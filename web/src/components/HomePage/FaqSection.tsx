'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FAQ = {
    question: string;
    answer: string | string[];
};

const faqs: FAQ[] = [
    {
        question: "What's the main difference between Stake21s and regular FLOW staking?",
        answer:
            "The main difference lies in the contract ('Akad'). Regular FLOW staking typically resembles a loan structure with uncertain yield — exposing investors to elements of Riba (interest) and Gharar (uncertainty). Stake21s uses an 'Ijarah' (lease) model instead. You lease your FLOW validation rights to us, and we pay you a fixed, pre-agreed rental fee ('Ujrah'), ensuring the process remains halal and transparent.",
    },
    {
        question: 'How are my returns fixed if FLOW staking rewards fluctuate?',
        answer:
            "Market staking rewards for FLOW can vary based on network performance and validator uptime. At Stake21s, all rewards go into a shared Treasury. You receive your fixed Ujrah payment from that Treasury, regardless of market fluctuations. Any gain or loss from the network is absorbed by the platform, not by you — protecting your peace of mind and preserving Sharia compliance.",
    },
    {
        question: 'How do you maintain ongoing Sharia compliance?',
        answer:
            "Our platform operates under the principle of 'Radical Transparency.' A certified Sharia Auditor continuously monitors our smart contracts and Treasury movements on-chain. They have read-only access to ensure all flows remain compliant with Islamic principles, with audit reports published publicly at regular intervals.",
    },
    {
        question: 'What are the potential risks involved with FLOW staking?',
        answer: [
            'While your rental return (Ujrah) is fixed, all blockchain protocols come with inherent risks, which we actively mitigate:',
            '• Smart Contract Risk: Potential code vulnerabilities. Our contracts are audited by top-tier security firms before deployment.',
            '• Validator Risk: If a validator is penalized (slashed) by the network, our Treasury is structured to absorb that penalty — protecting your leased FLOW principal.',
        ],
    },
    {
        question: 'What does the NFT/SBT I receive after depositing represent?',
        answer:
            "When you lease your FLOW, you’ll receive a digital proof — an NFT or SBT — that acts as your on-chain 'Ijarah Certificate'. This token represents your lease agreement and is required when you later withdraw your principal FLOW. Once redeemed, the NFT/SBT is burned automatically by the contract.",
    },
    {
        question: 'How do I start staking and later withdraw my FLOW?',
        answer: [
            'To Start: Connect your wallet on our app or Farcaster Frame, review the Ijarah agreement, and deposit your FLOW tokens.',
            'To Withdraw: Open your dashboard, submit a withdrawal request, and burn your Ijarah Certificate NFT/SBT. The smart contract will return your principal FLOW automatically to your wallet.',
        ],
    },
];

export default function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="container mx-auto py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Common Questions Answered
                </h2>
                <p className="text-gray-400 mb-12">
                    Everything you need to know about Sharia-compliant FLOW staking with
                    Stake21s.
                </p>
            </div>
            <div className="max-w-3xl mx-auto divide-y divide-gray-800">
                {faqs.map((faq, index) => (
                    <div key={index} className="py-6">
                        <button
                            onClick={() => toggle(index)}
                            className="w-full flex justify-between items-center text-left focus:outline-none"
                        >
                            <h4 className="text-lg font-medium text-white">{faq.question}</h4>
                            <ChevronDown
                                className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                                    openIndex === index ? 'rotate-180' : ''
                                }`}
                            />
                        </button>
                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                openIndex === index
                                    ? 'max-h-96 opacity-100 mt-4'
                                    : 'max-h-0 opacity-0'
                            }`}
                        >
                            {Array.isArray(faq.answer) ? (
                                <ul className="list-disc list-inside space-y-2 text-gray-400 leading-relaxed">
                                    {faq.answer.map((point, pointIndex) => (
                                        <li key={pointIndex}>{point}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
