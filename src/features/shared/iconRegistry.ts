import type {ForwardRefExoticComponent, SVGProps} from 'react';

import type {StarterPageIconName} from '@/models/starter-page';

// Generic / internal icons — Tabler collection.
import ActivityIcon from 'virtual:iconify/tabler/activity';
import BellIcon from 'virtual:iconify/tabler/bell';
import BookmarkIcon from 'virtual:iconify/tabler/bookmark';
import BoxIcon from 'virtual:iconify/tabler/box';
import CalendarIcon from 'virtual:iconify/tabler/calendar';
import ChartBarIcon from 'virtual:iconify/tabler/chart-bar';
import ChartHistogramIcon from 'virtual:iconify/tabler/chart-histogram';
import ChartLineIcon from 'virtual:iconify/tabler/chart-line';
import CloudIcon from 'virtual:iconify/tabler/cloud';
import CpuIcon from 'virtual:iconify/tabler/cpu';
import DatabaseIcon from 'virtual:iconify/tabler/database';
import DeviceTvIcon from 'virtual:iconify/tabler/device-tv';
import FileDescriptionIcon from 'virtual:iconify/tabler/file-description';
import FlameIcon from 'virtual:iconify/tabler/flame';
import FolderIcon from 'virtual:iconify/tabler/folder';
import GaugeIcon from 'virtual:iconify/tabler/gauge';
import HeadphonesIcon from 'virtual:iconify/tabler/headphones';
import HomeIcon from 'virtual:iconify/tabler/home';
import KeyIcon from 'virtual:iconify/tabler/key';
import LayoutDashboardIcon from 'virtual:iconify/tabler/layout-dashboard';
import LockIcon from 'virtual:iconify/tabler/lock';
import MailIcon from 'virtual:iconify/tabler/mail';
import MapPinIcon from 'virtual:iconify/tabler/map-pin';
import MusicIcon from 'virtual:iconify/tabler/music';
import NewsIcon from 'virtual:iconify/tabler/news';
import NotesIcon from 'virtual:iconify/tabler/notes';
import RouteIcon from 'virtual:iconify/tabler/route';
import RouterIcon from 'virtual:iconify/tabler/router';
import ServerIcon from 'virtual:iconify/tabler/server';
import Server2Icon from 'virtual:iconify/tabler/server-2';
import SettingsIcon from 'virtual:iconify/tabler/settings';
import ShieldIcon from 'virtual:iconify/tabler/shield';
import ShoppingCartIcon from 'virtual:iconify/tabler/shopping-cart';
import TimelineIcon from 'virtual:iconify/tabler/timeline';
import ToolsIcon from 'virtual:iconify/tabler/tools';
import VideoIcon from 'virtual:iconify/tabler/video';
import WorldIcon from 'virtual:iconify/tabler/world';

// Full-color brand icons — SVG Logos collection (embedded native colors).
import CloudflareIcon from 'virtual:iconify/logos/cloudflare-icon';
import DebianIcon from 'virtual:iconify/logos/debian';
import DiscordIcon from 'virtual:iconify/logos/discord';
import DockerIcon from 'virtual:iconify/logos/docker-icon';
import DropboxIcon from 'virtual:iconify/logos/dropbox';
import GitIcon from 'virtual:iconify/logos/git';
import GithubIcon from 'virtual:iconify/logos/github-icon';
import GitlabIcon from 'virtual:iconify/logos/gitlab';
import GmailIcon from 'virtual:iconify/logos/google-gmail';
import GoogleIcon from 'virtual:iconify/logos/google-icon';
import GoogleCalendarIcon from 'virtual:iconify/logos/google-calendar';
import GoogleDriveIcon from 'virtual:iconify/logos/google-drive';
import GoogleMapsIcon from 'virtual:iconify/logos/google-maps';
import GooglePhotosIcon from 'virtual:iconify/logos/google-photos';
import GrafanaIcon from 'virtual:iconify/logos/grafana';
import LinkedinIcon from 'virtual:iconify/logos/linkedin-icon';
import NotionIcon from 'virtual:iconify/logos/notion-icon';
import RedditIcon from 'virtual:iconify/logos/reddit-icon';
import RedhatIcon from 'virtual:iconify/logos/redhat-icon';
import SlackIcon from 'virtual:iconify/logos/slack-icon';
import SoundcloudIcon from 'virtual:iconify/logos/soundcloud';
import SpotifyIcon from 'virtual:iconify/logos/spotify';
import SteamIcon from 'virtual:iconify/logos/steam';
import TelegramIcon from 'virtual:iconify/logos/telegram';
import TwitchIcon from 'virtual:iconify/logos/twitch';
import UbuntuIcon from 'virtual:iconify/logos/ubuntu';
import YoutubeIcon from 'virtual:iconify/logos/youtube';

// UI-internal icons that are not part of the config icon whitelist.
import CategoryIcon from 'virtual:iconify/tabler/category';
import SearchIcon from 'virtual:iconify/tabler/search';

// Monochrome brand fallbacks — Simple Icons collection (tinted per brand).
import KickIcon from 'virtual:iconify/simple-icons/kick';
import NextcloudIcon from 'virtual:iconify/simple-icons/nextcloud';
import OpenvpnIcon from 'virtual:iconify/simple-icons/openvpn';
import PrintablesIcon from 'virtual:iconify/simple-icons/printables';
import ProxmoxIcon from 'virtual:iconify/simple-icons/proxmox';
import TruenasIcon from 'virtual:iconify/simple-icons/truenas';
import VlcIcon from 'virtual:iconify/simple-icons/vlcmediaplayer';

/**
 * Single icon ecosystem, generated at build time by @iconify/unplugin:
 *
 * - `tabler`       — generic/internal application icons.
 * - `logos`        — full-color brand logos (keep their embedded colors).
 * - `simple-icons` — monochrome brand fallback; tinted with the official brand
 *                    color from the registry so it stays recognizable.
 *
 * The registry is an explicit compile-time whitelist: runtime config only
 * carries these stable semantic ids, and only the icons referenced here end up
 * in the bundle. No dynamic imports, no Iconify API at build or runtime.
 *
 * This module is the single boundary that imports `virtual:iconify/*`; every
 * component goes through it (via `AppIcon` or the exported UI icons).
 */
export type IconComponent = ForwardRefExoticComponent<
  SVGProps<SVGSVGElement> & {title?: string}
>;

export type IconDefinition =
  | {component: IconComponent; kind: 'generic'}
  | {
      component: IconComponent;
      kind: 'brand';
      /**
       * Official brand color for monochrome (Simple Icons) logos. Omitted for
       * full-color logos whose SVG already carries its own palette.
       */
      color?: string;
    };

export const ICON_REGISTRY: Record<StarterPageIconName, IconDefinition> = {
  activity: {component: ActivityIcon, kind: 'generic'},
  audioteka: {component: HeadphonesIcon, kind: 'generic'},
  bell: {component: BellIcon, kind: 'generic'},
  bookmark: {component: BookmarkIcon, kind: 'generic'},
  box: {component: BoxIcon, kind: 'generic'},
  calendar: {component: CalendarIcon, kind: 'generic'},
  'chart-bar': {component: ChartBarIcon, kind: 'generic'},
  'chart-histogram': {component: ChartHistogramIcon, kind: 'generic'},
  'chart-line': {component: ChartLineIcon, kind: 'generic'},
  cloud: {component: CloudIcon, kind: 'generic'},
  cloudflare: {component: CloudflareIcon, kind: 'brand'},
  cpu: {component: CpuIcon, kind: 'generic'},
  database: {component: DatabaseIcon, kind: 'generic'},
  debian: {component: DebianIcon, kind: 'brand'},
  'device-tv': {component: DeviceTvIcon, kind: 'generic'},
  discord: {component: DiscordIcon, kind: 'brand'},
  docker: {component: DockerIcon, kind: 'brand'},
  dropbox: {component: DropboxIcon, kind: 'brand'},
  'file-description': {component: FileDescriptionIcon, kind: 'generic'},
  flame: {component: FlameIcon, kind: 'generic'},
  folder: {component: FolderIcon, kind: 'generic'},
  gauge: {component: GaugeIcon, kind: 'generic'},
  git: {component: GitIcon, kind: 'brand'},
  github: {component: GithubIcon, kind: 'brand'},
  gitlab: {component: GitlabIcon, kind: 'brand'},
  gmail: {component: GmailIcon, kind: 'brand'},
  google: {component: GoogleIcon, kind: 'brand'},
  'google-calendar': {component: GoogleCalendarIcon, kind: 'brand'},
  'google-drive': {component: GoogleDriveIcon, kind: 'brand'},
  'google-maps': {component: GoogleMapsIcon, kind: 'brand'},
  'google-photos': {component: GooglePhotosIcon, kind: 'brand'},
  grafana: {component: GrafanaIcon, kind: 'brand'},
  headphones: {component: HeadphonesIcon, kind: 'generic'},
  home: {component: HomeIcon, kind: 'generic'},
  jaeger: {component: RouteIcon, kind: 'generic'},
  key: {component: KeyIcon, kind: 'generic'},
  kick: {component: KickIcon, kind: 'brand', color: '#53FC19'},
  'layout-dashboard': {component: LayoutDashboardIcon, kind: 'generic'},
  linkedin: {component: LinkedinIcon, kind: 'brand'},
  lock: {component: LockIcon, kind: 'generic'},
  mail: {component: MailIcon, kind: 'generic'},
  'map-pin': {component: MapPinIcon, kind: 'generic'},
  music: {component: MusicIcon, kind: 'generic'},
  news: {component: NewsIcon, kind: 'generic'},
  nextcloud: {component: NextcloudIcon, kind: 'brand', color: '#0082C9'},
  notes: {component: NotesIcon, kind: 'generic'},
  notion: {component: NotionIcon, kind: 'brand'},
  openvpn: {component: OpenvpnIcon, kind: 'brand', color: '#EA7E20'},
  printables: {component: PrintablesIcon, kind: 'brand', color: '#FA6831'},
  proxmox: {component: ProxmoxIcon, kind: 'brand', color: '#E57000'},
  reddit: {component: RedditIcon, kind: 'brand'},
  redhat: {component: RedhatIcon, kind: 'brand'},
  route: {component: RouteIcon, kind: 'generic'},
  router: {component: RouterIcon, kind: 'generic'},
  server: {component: ServerIcon, kind: 'generic'},
  'server-2': {component: Server2Icon, kind: 'generic'},
  settings: {component: SettingsIcon, kind: 'generic'},
  shield: {component: ShieldIcon, kind: 'generic'},
  'shopping-cart': {component: ShoppingCartIcon, kind: 'generic'},
  slack: {component: SlackIcon, kind: 'brand'},
  soundcloud: {component: SoundcloudIcon, kind: 'brand'},
  spotify: {component: SpotifyIcon, kind: 'brand'},
  steam: {component: SteamIcon, kind: 'brand'},
  telegram: {component: TelegramIcon, kind: 'brand'},
  timeline: {component: TimelineIcon, kind: 'generic'},
  tools: {component: ToolsIcon, kind: 'generic'},
  truenas: {component: TruenasIcon, kind: 'brand', color: '#0095D5'},
  twitch: {component: TwitchIcon, kind: 'brand'},
  ubuntu: {component: UbuntuIcon, kind: 'brand'},
  video: {component: VideoIcon, kind: 'generic'},
  vlc: {component: VlcIcon, kind: 'brand', color: '#FF8800'},
  world: {component: WorldIcon, kind: 'generic'},
  youtube: {component: YoutubeIcon, kind: 'brand'},
};

/** Neutral fallback for unknown/absent config icon ids. */
export const FALLBACK_ICON: IconComponent = WorldIcon;

/**
 * Icons used by shared UI (not configurable via config): the search field and
 * the category marker. Exported here so this module stays the single place
 * that imports `virtual:iconify/*`.
 */
export const SEARCH_ICON: IconComponent = SearchIcon;
export const CATEGORY_FALLBACK_ICON: IconComponent = CategoryIcon;
