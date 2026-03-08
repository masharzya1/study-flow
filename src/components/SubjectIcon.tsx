import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Laptop,
  Palette,
  PenLine,
  TestTubes,
  BookText,
  Music,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  "calculator": Calculator,
  "flask-conical": FlaskConical,
  "globe": Globe,
  "laptop": Laptop,
  "palette": Palette,
  "pen-line": PenLine,
  "test-tubes": TestTubes,
  "book-text": BookText,
  "music": Music,
};

interface SubjectIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function SubjectIcon({ name, className = "w-5 h-5", size }: SubjectIconProps) {
  const Icon = iconMap[name] || BookOpen;
  return <Icon className={className} size={size} />;
}
