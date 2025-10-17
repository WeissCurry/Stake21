'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FAQ = {
    question: string;
    answer: string | string[]; 
};

const faqs: FAQ[] = [
    {
        question: "What's the main difference between Stake21s and regular staking?",
        answer:
            "The key difference is the contract ('Akad'). Regular staking often resembles a loan with uncertain interest (potential 'Riba' and 'Gharar'). Stake21s uses an 'Ijarah' (lease) contract. You lease the 'validation rights' of your ETH to us, and in return, you receive a fixed, pre-agreed rental fee ('Ujrah'). This structure eliminates financial uncertainty for you and ensures Sharia compliance.",
    },
    {
        question: 'How is my return fixed if market staking rewards fluctuate?',
        answer:
            "This is central to our model. The fluctuating rewards from staking (e.g., 3.5% or 4%) are collected into the platform's Treasury. We then pay you your fixed rental fee from this Treasury. Any profit or loss from the market fluctuation is a business risk absorbed entirely by the platform, not the user.",
    },
    {
        question: 'How do you ensure continuous Sharia compliance?',
        answer:
            "Compliance isn't just a one-time check. Our platform is built on 'Radical Transparency.' An independent, third-party Sharia Auditor has read-only on-chain access to verify all fund flows. They will publish periodic reports, ensuring our operations remain provably compliant at all times.",
    },
    {
        question: 'What are the primary risks involved?',
        answer: [
            'While your return rate is fixed, all DeFi protocols have inherent risks we work to mitigate:',
            'Smart Contract Risk: The risk of bugs in the code. Our contracts undergo rigorous third-party security audits before deployment.',
            'Slashing Risk: The risk of a validator being penalized by the network. Our Treasury is designed to cover potential slashing penalties to protect user principal.',
        ],
    },
    {
        question: 'What is the role of the NFT/SBT I receive after depositing?',
        answer:
            "The token (NFT/SBT) you receive is a digital certificate representing your lease agreement. It serves as your on-chain proof-of-lease. You will need to present and 'burn' this token to initiate the withdrawal process and reclaim your principal ETH.",
    },
    {
        question: 'How do I get started and withdraw my funds?',
        answer: [
            'To Start: Simply connect your wallet via our Farcaster Frame or web app, agree to the clear-text Ijarah contract, and deposit your ETH.',
            'To Withdraw: Access the user dashboard, request a withdrawal, burn your proof-of-lease NFT/SBT, and the smart contract will automatically return your principal ETH to your wallet.',
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
                    Everything you need to know about Sharia-compliant ETH staking with
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
                                className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>
                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index
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