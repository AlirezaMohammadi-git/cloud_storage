import bcrypt from "bcryptjs";

export const navItems = [
  {
    name: "Dashboard",
    icon: "/assets/icons/dashboard.svg",
    url: "/",
  },
  {
    name: "Documents",
    icon: "/assets/icons/documents.svg",
    url: "/documents",
  },
  {
    name: "Images",
    icon: "/assets/icons/images.svg",
    url: "/images",
  },
  {
    name: "Media",
    icon: "/assets/icons/video.svg",
    url: "/media",
  },
  {
    name: "Others",
    icon: "/assets/icons/others.svg",
    url: "/others",
  },
  {
    name: "Shared",
    icon: "/assets/icons/share-2.svg",
    url: "/shared",
  },
];

export const actionsDropdownItems = [
  {
    label: "Rename",
    icon: "/assets/icons/edit.svg",
    value: "rename",
  },
  {
    label: "Details",
    icon: "/assets/icons/info.svg",
    value: "details",
  },
  {
    label: "Share",
    icon: "/assets/icons/share.svg",
    value: "share",
  },
  {
    label: "Download",
    icon: "/assets/icons/download.svg",
    value: "download",
  },
  {
    label: "Delete",
    icon: "/assets/icons/delete.svg",
    value: "delete",
  },
];

export const sortTypes = [
  {
    label: "Date Edited (newest)",
    value: "lastedit DESC",
  },
  {
    label: "Date Edited (oldest)",
    value: "lastedit ASC",
  },
  {
    label: "Name (A-Z)",
    value: "name ASC",
  },
  {
    label: "Name (Z-A)",
    value: "name DESC",
  },
  {
    label: "Size (Highest)",
    value: "size DESC",
  },
  {
    label: "Size (Lowest)",
    value: "size ASC",
  },
];

export const avatarPlaceholderUrl =
  "https://avatar.iran.liara.run/public";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB


export const users: User[] = [
  {
    id: "e64c54ae-36ad-4adb-932a-76d949f6104f",
    fullname: "testUser",
    email: "test@user.com",
    avatar: avatarPlaceholderUrl,
    logInMethod: "OAuth"
  },
  {
    id: "55f0ddcf-6b75-4a01-b12d-88e3224d8ec6",
    fullname: "testUser2",
    email: "test2@user.com",
    avatar: avatarPlaceholderUrl,
    logInMethod: "credential"
  }
]

export const passwords: Passwords[] = [
  {
    id: "55f0ddcf-6b75-4a01-b12d-88e3224d8ec6",
    hash: bcrypt.hashSync("123456789")
  }
]

export const exampleFileMetadata: FileMetadata[] = [
  {
    id: "e64c54ae-36ad-4adb-932a-76d949f6104f",
    name: "testMetadata1",
    type: "image",
    size: 400000000,
    url: "null",
    lastEdited: new Date(),
    owner: "e64c54ae-36ad-4adb-932a-76d949f61043",
    shareWith: []
  },
  {
    id: "55f0ddcf-6b75-4a01-b12d-88e3224d8ec6",
    name: "testMetadata2",
    type: "document",
    size: 12345678910,
    url: "null",
    lastEdited: new Date(),
    owner: "55f0ddcf-6b75-4a01-b12d-88e3224d8ec6",
    shareWith: []
  }
]

export const UPLOAD_SIZE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
