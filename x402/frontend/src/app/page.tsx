"use client";

import { Web3HeroAnimated } from "@/components/animated-web3-landing-page";
import ElectricBorder from "@/components/ElectricBorder";
import SecureMessageGateway from "@/components/secure-message-gateway";
import { LiveDemo } from "@/components/live-demo";


const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};

const ValueCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="border border-white/[0.2] flex flex-col max-w-sm w-full mx-auto p-6 relative h-[30rem]">
      <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white" />

      <div className="relative z-20 flex flex-col h-full">
        <h3 className="text-white text-xl font-bold mb-4">{title}</h3>
        <p className="text-white/70 text-sm leading-relaxed flex-1">
          {description}
        </p>
      </div>
    </div>
  );
};

const ProcessCard = ({
  stepNumber,
  title,
  description,
}: {
  stepNumber: string;
  title: string;
  description: string;
}) => {
  return (
    <div className="relative border border-white/[0.2] flex flex-col p-8 h-full min-h-[280px] bg-black/40">
      <Icon className="absolute h-5 w-5 -top-2.5 -left-2.5 text-white" />
      <Icon className="absolute h-5 w-5 -bottom-2.5 -left-2.5 text-white" />
      <Icon className="absolute h-5 w-5 -top-2.5 -right-2.5 text-white" />
      <Icon className="absolute h-5 w-5 -bottom-2.5 -right-2.5 text-white" />

      <div className="absolute top-6 right-6">
        <span className="text-4xl font-bold text-white">{stepNumber}</span>
      </div>

      <div className="mt-auto">
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white/70 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};


export default function Home() {
  return (
   <>
     <Web3HeroAnimated></Web3HeroAnimated>

     <section className="py-20 px-4 bg-black text-white">
       <div className="container mx-auto max-w-7xl">
         <div className="text-center mb-16">
           <h2 className="text-4xl md:text-5xl font-bold mb-4">
             Why <span className="text-green-500">ATOMX</span>?
           </h2>
           <p className="text-white/60 text-lg">
             Value Proposition
           </p>
         </div>

         <div className="flex flex-col lg:flex-row items-center justify-center w-full gap-4 mx-auto px-8">
           <ValueCard
             title="No API Keys"
             description="Eliminate leaks, rotation, and manual onboarding. ATOMX removes the need for traditional API key management, eliminating security vulnerabilities from key leaks and the operational overhead of key rotation. No more manual onboarding processes or credential management headaches. Your agents authenticate seamlessly through blockchain-native mechanisms, ensuring maximum security with zero key exposure risk."
           />

           <ValueCard
             title="Agent-Native Payments"
             description="Agents pay autonomously using x402. Enable true autonomous agent operations where AI agents can initiate and complete payments independently without human intervention. The x402 protocol allows agents to manage their own wallets and execute transactions on-chain, creating a self-sustaining ecosystem where agents can operate, pay for services, and monetize their capabilities entirely on their own."
           />

           <ValueCard
             title="Instant On-Chain Settlement"
             description="Real-time verification on Cronos EVM. Every transaction is instantly verified and settled on the Cronos blockchain, providing transparent, immutable proof of payment and service delivery. No waiting periods, no intermediaries, no trust required. The blockchain acts as the ultimate source of truth, ensuring instant settlement with cryptographic guarantees that every payment is final and verifiable."
           />

         </div>
       </div>
     </section>

     <section className="py-20 px-4 bg-black text-white">
       <div className="container mx-auto max-w-7xl">
         <div className="text-center mb-16">
           <h2 className="text-4xl md:text-5xl font-bold mb-4">
             Built for <span className="text-green-500">Two Sides</span>
           </h2>
           <p className="text-white/60 text-lg">
             Merchant vs Agent
           </p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
           <div className="border border-white/20 rounded-2xl bg-black/40 backdrop-blur-sm p-8 flex flex-col">
             <div className="flex items-center gap-3 mb-4">
               <div>
                 <h3 className="text-2xl font-bold text-white">For API Providers</h3>
                 <p className="text-white/60 text-sm mt-1">Perfect for tooling providers</p>
               </div>
             </div>
             
             <div className="mt-6 mb-8">
               <p className="text-white/80 text-sm">
                 Everything you need to monetize your APIs with no hidden fees
               </p>
             </div>

             <ul className="space-y-4 flex-1 mb-8">
               <li className="flex items-start gap-3">
                 <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 <span className="text-white/80">Price per request</span>
               </li>
               <li className="flex items-start gap-3">
                 <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 <span className="text-white/80">Accept CRO / USDC</span>
               </li>
               <li className="flex items-start gap-3">
                 <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 <span className="text-white/80">No billing system needed</span>
               </li>
               <li className="flex items-start gap-3">
                 <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 <span className="text-white/80">Real-time analytics</span>
               </li>
             </ul>

             <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
               Get Started
             </button>
             <p className="text-white/60 text-xs text-center mt-3">Unlock new revenue</p>
           </div>

           <div className="border border-white/20 rounded-2xl bg-black/40 backdrop-blur-sm p-8 flex flex-col">
             <div className="flex items-center gap-3 mb-4">
               <div>
                 <h3 className="text-2xl font-bold text-white">For AI Agents</h3>
                 <p className="text-white/60 text-sm mt-1">Perfect for everyone</p>
               </div>
             </div>
             
             <div className="mt-6 mb-8">
               <p className="text-white/80 text-sm">
                 Everything you need to get started with no hidden fees
               </p>
             </div>

             <ul className="space-y-4 flex-1 mb-8">
               <li className="flex items-start gap-3">
                 <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 <span className="text-white/80">No accounts</span>
               </li>
               <li className="flex items-start gap-3">
                 <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 <span className="text-white/80">No keys</span>
               </li>
               <li className="flex items-start gap-3">
                 <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 <span className="text-white/80">No rate-limit guesswork</span>
               </li>
               <li className="flex items-start gap-3">
                 <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 <span className="text-white/80">Just pay and go</span>
               </li>
             </ul>

             <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
               Get Started
             </button>
             <p className="text-white/60 text-xs text-center mt-3">No account required</p>
           </div>
        </div>
      </div>
    </section>

    <section className="py-20 px-4 bg-black text-white">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Easy as <span className="text-green-500">01.02.03</span>
          </h2>
          <p className="text-white/60 text-lg">
            With no new accounts or billing information
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-6xl mx-auto">
          <ProcessCard
            stepNumber="01"
            title="Request"
            description="We help you find the best tool for the job and use it. No sign-up required."
          />
          <ProcessCard
            stepNumber="02"
            title="Pay"
            description="Any merchant, any network, pay your way. We handle settling up."
          />
          <ProcessCard
            stepNumber="03"
            title="Repeat"
            description="Go live instantly and start scaling your agents with confidence."
          />
        </div>
      </div>
    </section>

    <LiveDemo />

    <SecureMessageGateway />
   </>
  );
}
