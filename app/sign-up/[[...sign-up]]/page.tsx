import { SignUpForm } from "@/components/signup-form";
import MonkeyIcon from "@/components/icons/monkey";

export default function SignUpPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MonkeyIcon className="size-4" />
            </div>
            GTNinja
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full flex justify-center">
            <SignUpForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/login-bg.jpg"
          alt="Financial visualization"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.5] dark:grayscale"
        />
        {/* Overlay with gradient for depth */}
        <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-lg font-semibold text-foreground/90">
            &ldquo;GTNinja transformed how I analyze the Indian stock market. The real-time insights are incredible.&rdquo;
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            &mdash; Professional Trader
          </p>
        </div>
      </div>
    </div>
  );
}
