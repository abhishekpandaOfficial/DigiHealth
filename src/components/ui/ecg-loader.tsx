import { Heart } from "lucide-react"

export function ECGLoader({ message = "Loading health records..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full border border-violet-100 dark:border-violet-900/30 rounded-2xl bg-slate-50/30 dark:bg-slate-900/5 backdrop-blur-sm shadow-sm gap-4">
      <div className="flex items-center gap-3">
        <Heart className="size-5 text-red-500 animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">{message}</span>
      </div>
      
      <div className="relative w-64 h-12 overflow-hidden border border-slate-100 dark:border-slate-800 rounded-lg bg-black/5 dark:bg-black/30">
        {/* ECG grid line overlay */}
        <div 
          className="absolute inset-0 opacity-10 dark:opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(139, 92, 246) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(139, 92, 246) 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px'
          }}
        />
        
        {/* Animated ECG path */}
        <svg className="absolute inset-0 w-full h-full text-violet-500 dark:text-violet-400" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path d="M 0,50 L 40,50 L 50,20 L 55,80 L 60,45 L 65,55 L 75,50 L 115,50 L 125,20 L 130,80 L 135,45 L 140,55 L 150,50 L 200,50" 
                fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* Sweeping scanner cover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-slate-900 to-white dark:to-slate-900 w-[200%] ecg-sweep-animation"></div>
      </div>
    </div>
  )
}

export default ECGLoader
