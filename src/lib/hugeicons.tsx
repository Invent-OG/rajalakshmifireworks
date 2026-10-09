/**
 * Hugeicons Design System Adapter
 * Replaces generic Lucide icons with authentic Hugeicons across the entire site.
 */
import React from "react";
import * as HugeIcons from "hugeicons-react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
};

export type LucideIcon = React.FC<IconProps>;
export type HugeIcon = React.FC<IconProps>;

function createIcon(HugeIconComp: React.FC<any>): React.FC<IconProps> {
  const Icon: React.FC<IconProps> = ({ size, color = "currentColor", strokeWidth, className, ...props }) => {
    return React.createElement(HugeIconComp, {
      size: size ?? 24,
      color: color,
      strokeWidth: strokeWidth ?? 1.5,
      className,
      ...props
    });
  };
  Icon.displayName = (HugeIconComp as any)?.displayName || "HugeIcon";
  return Icon;
}

export const AlertCircle: React.FC<IconProps> = createIcon(HugeIcons.AlertCircleIcon);
export const AlertTriangle: React.FC<IconProps> = createIcon(HugeIcons.Alert02Icon);
export const Archive: React.FC<IconProps> = createIcon(HugeIcons.ArchiveIcon);
export const ArrowLeft: React.FC<IconProps> = createIcon(HugeIcons.ArrowLeft01Icon);
export const ArrowRight: React.FC<IconProps> = createIcon(HugeIcons.ArrowRight01Icon);
export const ArrowUpDown: React.FC<IconProps> = createIcon(HugeIcons.Sorting01Icon);
export const ArrowUpRight: React.FC<IconProps> = createIcon(HugeIcons.ArrowUpRight01Icon);
export const Award: React.FC<IconProps> = createIcon(HugeIcons.Award01Icon);
export const BarChart3: React.FC<IconProps> = createIcon(HugeIcons.BarChartIcon);
export const Bell: React.FC<IconProps> = createIcon(HugeIcons.Notification01Icon);
export const Boxes: React.FC<IconProps> = createIcon(HugeIcons.Package01Icon);
export const Building2: React.FC<IconProps> = createIcon(HugeIcons.Building01Icon);
export const Calculator: React.FC<IconProps> = createIcon(HugeIcons.Calculator01Icon);
export const Calendar: React.FC<IconProps> = createIcon(HugeIcons.Calendar01Icon);
export const Car: React.FC<IconProps> = createIcon(HugeIcons.Car01Icon);
export const Check: React.FC<IconProps> = createIcon(HugeIcons.CheckmarkBadge01Icon);
export const CheckCircle: React.FC<IconProps> = createIcon(HugeIcons.CheckmarkCircle01Icon);
export const CheckCircle2: React.FC<IconProps> = createIcon(HugeIcons.CheckmarkCircle01Icon);
export const CheckSquare: React.FC<IconProps> = createIcon(HugeIcons.CheckmarkSquare01Icon);
export const ChevronDown: React.FC<IconProps> = createIcon(HugeIcons.ArrowDown01Icon);
export const ChevronLeft: React.FC<IconProps> = createIcon(HugeIcons.ArrowLeft01Icon);
export const ChevronRight: React.FC<IconProps> = createIcon(HugeIcons.ArrowRight01Icon);
export const ChevronUp: React.FC<IconProps> = createIcon(HugeIcons.ArrowUp01Icon);
export const ChevronsLeft: React.FC<IconProps> = createIcon(HugeIcons.ArrowLeftDoubleIcon);
export const ChevronsRight: React.FC<IconProps> = createIcon(HugeIcons.ArrowRightDoubleIcon);
export const CircleDot: React.FC<IconProps> = createIcon(HugeIcons.RadioButtonIcon);
export const Clock: React.FC<IconProps> = createIcon(HugeIcons.Clock01Icon);
export const CloudUpload: React.FC<IconProps> = createIcon(HugeIcons.CloudUploadIcon);
export const Copy: React.FC<IconProps> = createIcon(HugeIcons.Copy01Icon);
export const CreditCard: React.FC<IconProps> = createIcon(HugeIcons.CreditCardIcon);
export const Database: React.FC<IconProps> = createIcon(HugeIcons.Database01Icon);
export const Disc: React.FC<IconProps> = createIcon(HugeIcons.CdIcon);
export const DollarSign: React.FC<IconProps> = createIcon(HugeIcons.DollarSquareIcon);
export const Download: React.FC<IconProps> = createIcon(HugeIcons.Download01Icon);
export const Edit: React.FC<IconProps> = createIcon(HugeIcons.Edit01Icon);
export const Edit2: React.FC<IconProps> = createIcon(HugeIcons.Edit02Icon);
export const ExternalLink: React.FC<IconProps> = createIcon(HugeIcons.LinkSquare01Icon);
export const Eye: React.FC<IconProps> = createIcon(HugeIcons.ViewIcon);
export const EyeOff: React.FC<IconProps> = createIcon(HugeIcons.ViewOffSlashIcon);
export const FileSpreadsheet: React.FC<IconProps> = createIcon(HugeIcons.Csv01Icon);
export const FileText: React.FC<IconProps> = createIcon(HugeIcons.File01Icon);
export const Film: React.FC<IconProps> = createIcon(HugeIcons.Film01Icon);
export const Filter: React.FC<IconProps> = createIcon(HugeIcons.FilterIcon);
export const Flame: React.FC<IconProps> = createIcon(HugeIcons.FireIcon);
export const FolderTree: React.FC<IconProps> = createIcon(HugeIcons.Folder01Icon);
export const Gift: React.FC<IconProps> = createIcon(HugeIcons.GiftIcon);
export const Globe: React.FC<IconProps> = createIcon(HugeIcons.GlobeIcon);
export const HelpCircle: React.FC<IconProps> = createIcon(HugeIcons.HelpCircleIcon);
export const History: React.FC<IconProps> = createIcon(HugeIcons.Time02Icon);
export const Home: React.FC<IconProps> = createIcon(HugeIcons.Home01Icon);
export const Image: React.FC<IconProps> = createIcon(HugeIcons.Image01Icon);
export const IndianRupee: React.FC<IconProps> = createIcon(HugeIcons.RupeeIcon);
export const KeyRound: React.FC<IconProps> = createIcon(HugeIcons.Key01Icon);
export const Layers: React.FC<IconProps> = createIcon(HugeIcons.Layers01Icon);
export const LayoutDashboard: React.FC<IconProps> = createIcon(HugeIcons.DashboardSquare01Icon);
export const LayoutGrid: React.FC<IconProps> = createIcon(HugeIcons.LayoutGridIcon);
export const Leaf: React.FC<IconProps> = createIcon(HugeIcons.Leaf01Icon);
export const Link: React.FC<IconProps> = createIcon(HugeIcons.Link01Icon);
export const Loader2: React.FC<IconProps> = createIcon(HugeIcons.Loading01Icon);
export const Lock: React.FC<IconProps> = createIcon(HugeIcons.LockIcon);
export const LogOut: React.FC<IconProps> = createIcon(HugeIcons.Logout01Icon);
export const Mail: React.FC<IconProps> = createIcon(HugeIcons.Mail01Icon);
export const MapPin: React.FC<IconProps> = createIcon(HugeIcons.Location01Icon);
export const Menu: React.FC<IconProps> = createIcon(HugeIcons.Menu01Icon);
export const MessageSquare: React.FC<IconProps> = createIcon(HugeIcons.BubbleChatIcon);
export const Minus: React.FC<IconProps> = createIcon(HugeIcons.MinusSignIcon);
export const Moon: React.FC<IconProps> = createIcon(HugeIcons.Moon01Icon);
export const MoveDown: React.FC<IconProps> = createIcon(HugeIcons.ArrowDown01Icon);
export const MoveUp: React.FC<IconProps> = createIcon(HugeIcons.ArrowUp01Icon);
export const Package: React.FC<IconProps> = createIcon(HugeIcons.Package01Icon);
export const Palette: React.FC<IconProps> = createIcon(HugeIcons.ColorsIcon);
export const Pause: React.FC<IconProps> = createIcon(HugeIcons.PauseIcon);
export const PenTool: React.FC<IconProps> = createIcon(HugeIcons.PenTool01Icon);
export const Percent: React.FC<IconProps> = createIcon(HugeIcons.PercentIcon);
export const Phone: React.FC<IconProps> = createIcon(HugeIcons.CallIcon);
export const Play: React.FC<IconProps> = createIcon(HugeIcons.PlayIcon);
export const Plus: React.FC<IconProps> = createIcon(HugeIcons.PlusSignIcon);
export const Printer: React.FC<IconProps> = createIcon(HugeIcons.PrinterIcon);
export const Radio: React.FC<IconProps> = createIcon(HugeIcons.RadioIcon);
export const RefreshCw: React.FC<IconProps> = createIcon(HugeIcons.RefreshIcon);
export const Repeat: React.FC<IconProps> = createIcon(HugeIcons.RepeatIcon);
export const RotateCcw: React.FC<IconProps> = createIcon(HugeIcons.RotateLeft01Icon);
export const Save: React.FC<IconProps> = createIcon(HugeIcons.FloppyDiskIcon);
export const Scale: React.FC<IconProps> = createIcon(HugeIcons.JusticeScale01Icon);
export const Search: React.FC<IconProps> = createIcon(HugeIcons.Search01Icon);
export const Settings: React.FC<IconProps> = createIcon(HugeIcons.Settings01Icon);
export const Share2: React.FC<IconProps> = createIcon(HugeIcons.Share01Icon);
export const Shield: React.FC<IconProps> = createIcon(HugeIcons.Shield01Icon);
export const ShieldAlert: React.FC<IconProps> = createIcon(HugeIcons.Shield01Icon);
export const ShieldCheck: React.FC<IconProps> = createIcon(HugeIcons.Shield01Icon);
export const ShoppingBag: React.FC<IconProps> = createIcon(HugeIcons.ShoppingBag01Icon);
export const ShoppingCart: React.FC<IconProps> = createIcon(HugeIcons.ShoppingCart01Icon);
export const Sliders: React.FC<IconProps> = createIcon(HugeIcons.SlidersHorizontalIcon);
export const SlidersHorizontal: React.FC<IconProps> = createIcon(HugeIcons.SlidersHorizontalIcon);
export const Sparkle: React.FC<IconProps> = createIcon(HugeIcons.SparklesIcon);
export const Sparkles: React.FC<IconProps> = createIcon(HugeIcons.SparklesIcon);
export const Square: React.FC<IconProps> = createIcon(HugeIcons.SquareIcon);
export const Star: React.FC<IconProps> = createIcon(HugeIcons.StarIcon);
export const Store: React.FC<IconProps> = createIcon(HugeIcons.Store01Icon);
export const Sun: React.FC<IconProps> = createIcon(HugeIcons.Sun01Icon);
export const Tags: React.FC<IconProps> = createIcon(HugeIcons.Tag01Icon);
export const Trash2: React.FC<IconProps> = createIcon(HugeIcons.Delete01Icon);
export const TrendingDown: React.FC<IconProps> = createIcon(HugeIcons.TradeDownIcon);
export const TrendingUp: React.FC<IconProps> = createIcon(HugeIcons.TradeUpIcon);
export const Truck: React.FC<IconProps> = createIcon(HugeIcons.DeliveryTruck01Icon);
export const Upload: React.FC<IconProps> = createIcon(HugeIcons.Upload01Icon);
export const UploadCloud: React.FC<IconProps> = createIcon(HugeIcons.CloudUploadIcon);
export const User: React.FC<IconProps> = createIcon(HugeIcons.UserIcon);
export const UserCog: React.FC<IconProps> = createIcon(HugeIcons.AccountSetting01Icon);
export const Users: React.FC<IconProps> = createIcon(HugeIcons.UserGroupIcon);
export const Video: React.FC<IconProps> = createIcon(HugeIcons.Video01Icon);
export const Volume2: React.FC<IconProps> = createIcon(HugeIcons.VolumeHighIcon);
export const VolumeX: React.FC<IconProps> = createIcon(HugeIcons.VolumeOffIcon);
export const Warehouse: React.FC<IconProps> = createIcon(HugeIcons.WarehouseIcon);
export const Wind: React.FC<IconProps> = createIcon(HugeIcons.FastWindIcon);
export const X: React.FC<IconProps> = createIcon(HugeIcons.Cancel01Icon);
export const XCircle: React.FC<IconProps> = createIcon(HugeIcons.CancelCircleIcon);
export const Building: React.FC<IconProps> = createIcon(HugeIcons.Building01Icon);
export const Medal: React.FC<IconProps> = createIcon(HugeIcons.Medal01Icon);
export const Target: React.FC<IconProps> = createIcon(HugeIcons.Target01Icon);
export const Trophy: React.FC<IconProps> = createIcon(HugeIcons.ChampionIcon);
export const UserCheck: React.FC<IconProps> = createIcon(HugeIcons.UserCheck01Icon);
export const UserPlus: React.FC<IconProps> = createIcon(HugeIcons.UserAdd01Icon);
export const Zap: React.FC<IconProps> = createIcon(HugeIcons.FlashIcon);

export default {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Calculator,
  Calendar,
  Car,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  CircleDot,
  Clock,
  CloudUpload,
  Copy,
  CreditCard,
  Database,
  Disc,
  DollarSign,
  Download,
  Edit,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Film,
  Filter,
  Flame,
  FolderTree,
  Gift,
  Globe,
  HelpCircle,
  History,
  Home,
  Image,
  IndianRupee,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Leaf,
  Link,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Moon,
  MoveDown,
  MoveUp,
  Package,
  Palette,
  Pause,
  PenTool,
  Percent,
  Phone,
  Play,
  Plus,
  Printer,
  Radio,
  RefreshCw,
  Repeat,
  RotateCcw,
  Save,
  Scale,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  SlidersHorizontal,
  Sparkle,
  Sparkles,
  Square,
  Star,
  Store,
  Sun,
  Tags,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Upload,
  UploadCloud,
  User,
  UserCog,
  Users,
  Video,
  Volume2,
  VolumeX,
  Warehouse,
  Wind,
  X,
  XCircle,
  Building,
  Medal,
  Target,
  Trophy,
  UserCheck,
  UserPlus,
  Zap
};
