/**
 * Hugeicons Design System Adapter
 * Replaces generic Lucide icons with authentic Hugeicons across the entire site.
 * Uses named tree-shakable imports to avoid bundling the entire 21MB hugeicons package.
 */
import React from "react";
import {
  AlertCircleIcon,
  Alert02Icon,
  ArchiveIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Sorting01Icon,
  ArrowUpRight01Icon,
  Award01Icon,
  BarChartIcon,
  Notification01Icon,
  Package01Icon,
  Building01Icon,
  Calculator01Icon,
  Calendar01Icon,
  Car01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  CheckmarkSquare01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  RadioButtonIcon,
  Clock01Icon,
  CloudUploadIcon,
  Copy01Icon,
  CreditCardIcon,
  Database01Icon,
  CdIcon,
  DollarSquareIcon,
  Download01Icon,
  Edit01Icon,
  Edit02Icon,
  LinkSquare01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  Csv01Icon,
  File01Icon,
  Film01Icon,
  FilterIcon,
  FireIcon,
  Folder01Icon,
  GiftIcon,
  GlobeIcon,
  HelpCircleIcon,
  Time02Icon,
  Home01Icon,
  Image01Icon,
  RupeeIcon,
  Key01Icon,
  Layers01Icon,
  DashboardSquare01Icon,
  LayoutGridIcon,
  Leaf01Icon,
  Link01Icon,
  Loading01Icon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  Location01Icon,
  Menu01Icon,
  BubbleChatIcon,
  MinusSignIcon,
  Moon01Icon,
  ColorsIcon,
  PauseIcon,
  PenTool01Icon,
  PercentIcon,
  CallIcon,
  PlayIcon,
  PlusSignIcon,
  PrinterIcon,
  RadioIcon,
  RefreshIcon,
  RepeatIcon,
  RotateLeft01Icon,
  FloppyDiskIcon,
  JusticeScale01Icon,
  Search01Icon,
  Settings01Icon,
  Share01Icon,
  Shield01Icon,
  ShoppingBag01Icon,
  ShoppingCart01Icon,
  SlidersHorizontalIcon,
  SparklesIcon,
  SquareIcon,
  StarIcon,
  InformationCircleIcon,
  Store01Icon,
  Sun01Icon,
  Tag01Icon,
  Delete01Icon,
  TradeDownIcon,
  TradeUpIcon,
  DeliveryTruck01Icon,
  Upload01Icon,
  UserIcon,
  AccountSetting01Icon,
  UserGroupIcon,
  Video01Icon,
  VolumeHighIcon,
  VolumeOffIcon,
  WarehouseIcon,
  FastWindIcon,
  Cancel01Icon,
  CancelCircleIcon,
  Medal01Icon,
  Target01Icon,
  ChampionIcon,
  UserCheck01Icon,
  UserAdd01Icon,
  FlashIcon,
} from "hugeicons-react";

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

export const AlertCircle: React.FC<IconProps> = createIcon(AlertCircleIcon);
export const AlertTriangle: React.FC<IconProps> = createIcon(Alert02Icon);
export const Archive: React.FC<IconProps> = createIcon(ArchiveIcon);
export const ArrowLeft: React.FC<IconProps> = createIcon(ArrowLeft01Icon);
export const ArrowRight: React.FC<IconProps> = createIcon(ArrowRight01Icon);
export const ArrowUpDown: React.FC<IconProps> = createIcon(Sorting01Icon);
export const ArrowUpRight: React.FC<IconProps> = createIcon(ArrowUpRight01Icon);
export const Award: React.FC<IconProps> = createIcon(Award01Icon);
export const BarChart3: React.FC<IconProps> = createIcon(BarChartIcon);
export const Bell: React.FC<IconProps> = createIcon(Notification01Icon);
export const Boxes: React.FC<IconProps> = createIcon(Package01Icon);
export const Building2: React.FC<IconProps> = createIcon(Building01Icon);
export const Calculator: React.FC<IconProps> = createIcon(Calculator01Icon);
export const Calendar: React.FC<IconProps> = createIcon(Calendar01Icon);
export const Car: React.FC<IconProps> = createIcon(Car01Icon);
export const Check: React.FC<IconProps> = createIcon(CheckmarkBadge01Icon);
export const CheckCircle: React.FC<IconProps> = createIcon(CheckmarkCircle01Icon);
export const CheckCircle2: React.FC<IconProps> = createIcon(CheckmarkCircle01Icon);
export const CheckSquare: React.FC<IconProps> = createIcon(CheckmarkSquare01Icon);
export const ChevronDown: React.FC<IconProps> = createIcon(ArrowDown01Icon);
export const ChevronLeft: React.FC<IconProps> = createIcon(ArrowLeft01Icon);
export const ChevronRight: React.FC<IconProps> = createIcon(ArrowRight01Icon);
export const ChevronUp: React.FC<IconProps> = createIcon(ArrowUp01Icon);
export const ChevronsLeft: React.FC<IconProps> = createIcon(ArrowLeftDoubleIcon);
export const ChevronsRight: React.FC<IconProps> = createIcon(ArrowRightDoubleIcon);
export const CircleDot: React.FC<IconProps> = createIcon(RadioButtonIcon);
export const Clock: React.FC<IconProps> = createIcon(Clock01Icon);
export const CloudUpload: React.FC<IconProps> = createIcon(CloudUploadIcon);
export const Copy: React.FC<IconProps> = createIcon(Copy01Icon);
export const CreditCard: React.FC<IconProps> = createIcon(CreditCardIcon);
export const Database: React.FC<IconProps> = createIcon(Database01Icon);
export const Disc: React.FC<IconProps> = createIcon(CdIcon);
export const DollarSign: React.FC<IconProps> = createIcon(DollarSquareIcon);
export const Download: React.FC<IconProps> = createIcon(Download01Icon);
export const Edit: React.FC<IconProps> = createIcon(Edit01Icon);
export const Edit2: React.FC<IconProps> = createIcon(Edit02Icon);
export const ExternalLink: React.FC<IconProps> = createIcon(LinkSquare01Icon);
export const Eye: React.FC<IconProps> = createIcon(ViewIcon);
export const EyeOff: React.FC<IconProps> = createIcon(ViewOffSlashIcon);
export const FileSpreadsheet: React.FC<IconProps> = createIcon(Csv01Icon);
export const FileText: React.FC<IconProps> = createIcon(File01Icon);
export const Film: React.FC<IconProps> = createIcon(Film01Icon);
export const Filter: React.FC<IconProps> = createIcon(FilterIcon);
export const Flame: React.FC<IconProps> = createIcon(FireIcon);
export const FolderTree: React.FC<IconProps> = createIcon(Folder01Icon);
export const Gift: React.FC<IconProps> = createIcon(GiftIcon);
export const Globe: React.FC<IconProps> = createIcon(GlobeIcon);
export const HelpCircle: React.FC<IconProps> = createIcon(HelpCircleIcon);
export const History: React.FC<IconProps> = createIcon(Time02Icon);
export const Home: React.FC<IconProps> = createIcon(Home01Icon);
export const Image: React.FC<IconProps> = createIcon(Image01Icon);
export const IndianRupee: React.FC<IconProps> = createIcon(RupeeIcon);
export const KeyRound: React.FC<IconProps> = createIcon(Key01Icon);
export const Layers: React.FC<IconProps> = createIcon(Layers01Icon);
export const LayoutDashboard: React.FC<IconProps> = createIcon(DashboardSquare01Icon);
export const LayoutGrid: React.FC<IconProps> = createIcon(LayoutGridIcon);
export const Leaf: React.FC<IconProps> = createIcon(Leaf01Icon);
export const Link: React.FC<IconProps> = createIcon(Link01Icon);
export const Loader2: React.FC<IconProps> = createIcon(Loading01Icon);
export const Lock: React.FC<IconProps> = createIcon(LockIcon);
export const LogOut: React.FC<IconProps> = createIcon(Logout01Icon);
export const Mail: React.FC<IconProps> = createIcon(Mail01Icon);
export const MapPin: React.FC<IconProps> = createIcon(Location01Icon);
export const Menu: React.FC<IconProps> = createIcon(Menu01Icon);
export const MessageSquare: React.FC<IconProps> = createIcon(BubbleChatIcon);
export const Minus: React.FC<IconProps> = createIcon(MinusSignIcon);
export const Moon: React.FC<IconProps> = createIcon(Moon01Icon);
export const MoveDown: React.FC<IconProps> = createIcon(ArrowDown01Icon);
export const MoveUp: React.FC<IconProps> = createIcon(ArrowUp01Icon);
export const Package: React.FC<IconProps> = createIcon(Package01Icon);
export const Palette: React.FC<IconProps> = createIcon(ColorsIcon);
export const Pause: React.FC<IconProps> = createIcon(PauseIcon);
export const PenTool: React.FC<IconProps> = createIcon(PenTool01Icon);
export const Percent: React.FC<IconProps> = createIcon(PercentIcon);
export const Phone: React.FC<IconProps> = createIcon(CallIcon);
export const Play: React.FC<IconProps> = createIcon(PlayIcon);
export const Plus: React.FC<IconProps> = createIcon(PlusSignIcon);
export const Printer: React.FC<IconProps> = createIcon(PrinterIcon);
export const Radio: React.FC<IconProps> = createIcon(RadioIcon);
export const RefreshCw: React.FC<IconProps> = createIcon(RefreshIcon);
export const Repeat: React.FC<IconProps> = createIcon(RepeatIcon);
export const RotateCcw: React.FC<IconProps> = createIcon(RotateLeft01Icon);
export const Save: React.FC<IconProps> = createIcon(FloppyDiskIcon);
export const Scale: React.FC<IconProps> = createIcon(JusticeScale01Icon);
export const Search: React.FC<IconProps> = createIcon(Search01Icon);
export const Settings: React.FC<IconProps> = createIcon(Settings01Icon);
export const Share2: React.FC<IconProps> = createIcon(Share01Icon);
export const Shield: React.FC<IconProps> = createIcon(Shield01Icon);
export const ShieldAlert: React.FC<IconProps> = createIcon(Shield01Icon);
export const ShieldCheck: React.FC<IconProps> = createIcon(Shield01Icon);
export const ShoppingBag: React.FC<IconProps> = createIcon(ShoppingBag01Icon);
export const ShoppingCart: React.FC<IconProps> = createIcon(ShoppingCart01Icon);
export const Sliders: React.FC<IconProps> = createIcon(SlidersHorizontalIcon);
export const SlidersHorizontal: React.FC<IconProps> = createIcon(SlidersHorizontalIcon);
export const Sparkle: React.FC<IconProps> = createIcon(SparklesIcon);
export const Sparkles: React.FC<IconProps> = createIcon(SparklesIcon);
export const Square: React.FC<IconProps> = createIcon(SquareIcon);
export const Star: React.FC<IconProps> = createIcon(StarIcon);
export const Info: React.FC<IconProps> = createIcon(InformationCircleIcon);
export const Store: React.FC<IconProps> = createIcon(Store01Icon);
export const Sun: React.FC<IconProps> = createIcon(Sun01Icon);
export const Tag: React.FC<IconProps> = createIcon(Tag01Icon);
export const Tags: React.FC<IconProps> = createIcon(Tag01Icon);
export const Trash2: React.FC<IconProps> = createIcon(Delete01Icon);
export const TrendingDown: React.FC<IconProps> = createIcon(TradeDownIcon);
export const TrendingUp: React.FC<IconProps> = createIcon(TradeUpIcon);
export const Truck: React.FC<IconProps> = createIcon(DeliveryTruck01Icon);
export const Upload: React.FC<IconProps> = createIcon(Upload01Icon);
export const UploadCloud: React.FC<IconProps> = createIcon(CloudUploadIcon);
export const User: React.FC<IconProps> = createIcon(UserIcon);
export const UserCog: React.FC<IconProps> = createIcon(AccountSetting01Icon);
export const Users: React.FC<IconProps> = createIcon(UserGroupIcon);
export const Video: React.FC<IconProps> = createIcon(Video01Icon);
export const Volume2: React.FC<IconProps> = createIcon(VolumeHighIcon);
export const VolumeX: React.FC<IconProps> = createIcon(VolumeOffIcon);
export const Warehouse: React.FC<IconProps> = createIcon(WarehouseIcon);
export const Wind: React.FC<IconProps> = createIcon(FastWindIcon);
export const X: React.FC<IconProps> = createIcon(Cancel01Icon);
export const XCircle: React.FC<IconProps> = createIcon(CancelCircleIcon);
export const Ban: React.FC<IconProps> = createIcon(CancelCircleIcon);
export const Building: React.FC<IconProps> = createIcon(Building01Icon);
export const Medal: React.FC<IconProps> = createIcon(Medal01Icon);
export const Target: React.FC<IconProps> = createIcon(Target01Icon);
export const Trophy: React.FC<IconProps> = createIcon(ChampionIcon);
export const UserCheck: React.FC<IconProps> = createIcon(UserCheck01Icon);
export const UserPlus: React.FC<IconProps> = createIcon(UserAdd01Icon);
export const Zap: React.FC<IconProps> = createIcon(FlashIcon);

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
  Info,
  Store,
  Sun,
  Tag,
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
  Ban,
  Building,
  Medal,
  Target,
  Trophy,
  UserCheck,
  UserPlus,
  Zap
};
