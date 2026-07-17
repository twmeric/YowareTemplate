import {
  Shield,
  Clock,
  GraduationCap,
  Leaf,
  Zap,
  Brain,
  Heart,
  ClipboardList,
  Stethoscope,
  FileText,
  RotateCcw,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Clock,
  GraduationCap,
  Leaf,
  Zap,
  Brain,
  Heart,
  ClipboardList,
  Stethoscope,
  FileText,
  RotateCcw,
  BookOpen,
};

interface IconProps {
  name: string;
  className?: string;
}

export default function Icon({ name, className = "h-6 w-6" }: IconProps) {
  const LucideComponent = iconMap[name] ?? Heart;
  return <LucideComponent className={className} aria-hidden="true" />;
}
