import { cn } from "@/lib/utils";

export function PersonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
      className={cn("fill-current", props.className)}
    >
      <path d="M12 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM8.5 9.5a3.5 3.5 0 1 0 7 0h-7Zm3.5 11a2 2 0 0 0 2-2v-7.5a.5.5 0 0 1 1 0V20a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-7.5a.5.5 0 0 1 1 0V18a2 2 0 0 0 2 2h2Z" />
    </svg>
  );
}
