/**
 * Catalog of machine images (AMIs) and instance types for the Compute service.
 * Mirrors the backend MachineImage and InstanceType enums.
 */

const MACHINE_IMAGES = [
  {
    id: 'UBUNTU_22_04',
    name: 'Ubuntu 22.04',
    description: 'LTS · Most popular',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-original.svg',
    bgColor: 'bg-orange-500/10',
    accentColor: 'border-orange-500/60 bg-orange-500/[0.07]',
  },
  {
    id: 'UBUNTU_24_04',
    name: 'Ubuntu 24.04',
    description: 'LTS · Latest',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-original.svg',
    bgColor: 'bg-orange-500/10',
    accentColor: 'border-orange-500/60 bg-orange-500/[0.07]',
  },
  {
    id: 'DEBIAN_12',
    name: 'Debian 12',
    description: 'Stable · Bookworm',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/debian/debian-original.svg',
    bgColor: 'bg-red-500/10',
    accentColor: 'border-red-500/60 bg-red-500/[0.07]',
  },
  {
    id: 'ALPINE_3_19',
    name: 'Alpine 3.19',
    description: 'Minimal · Lightweight',
    logo: 'https://cdn.simpleicons.org/alpinelinux/0D597F',
    bgColor: 'bg-sky-500/10',
    accentColor: 'border-sky-500/60 bg-sky-500/[0.07]',
  },
  {
    id: 'AMAZON_LINUX_2023',
    name: 'Amazon Linux',
    description: '2023 · AWS flavor',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
    bgColor: 'bg-amber-500/10',
    accentColor: 'border-amber-500/60 bg-amber-500/[0.07]',
  },
];

const INSTANCE_TYPES = [
  { id: 'T3_NANO',   name: 't3.nano',   vcpus: 1, memoryMb: 128,  description: '1 vCPU · 128 MB' },
  { id: 'T3_MICRO',  name: 't3.micro',  vcpus: 1, memoryMb: 256,  description: '1 vCPU · 256 MB — recommended' },
  { id: 'T3_SMALL',  name: 't3.small',  vcpus: 1, memoryMb: 512,  description: '1 vCPU · 512 MB' },
  { id: 'T3_MEDIUM', name: 't3.medium', vcpus: 2, memoryMb: 1024, description: '2 vCPU · 1 GB' },
  { id: 'T3_LARGE',  name: 't3.large',  vcpus: 2, memoryMb: 2048, description: '2 vCPU · 2 GB' },
];

const getImageInfo = (id) => MACHINE_IMAGES.find(i => i.id === id) || MACHINE_IMAGES[0];
const getInstanceTypeInfo = (id) => INSTANCE_TYPES.find(t => t.id === id) || INSTANCE_TYPES[1];

export { MACHINE_IMAGES, INSTANCE_TYPES, getImageInfo, getInstanceTypeInfo };
