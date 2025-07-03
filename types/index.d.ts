/* eslint-disable no-unused-vars */

import NextAuth from "next-auth";

declare global {




  //################  files related types
  declare type FileType = "document" | "image" | "video" | "audio" | "other";
  declare type FileResult = {
    success: true,
    data: unknown,
  } | {
    success: false,
    error: string
  }
  declare interface ActionType {
    label: string;
    icon: string;
    value: string;
  }
  declare interface FileMeataData {
    id: string,
    name: string,
    type: FileType,
    url: string,
    size: number,
    dateAdded: Date,
    owner: string,
    shareWith: string[]
  }
  // Define a type for PostgreSQL errors
  type PostgresError = {
    code: string; // PostgreSQL error code (like "23505" for unique violation)
    message: string;
    // Add other properties you need
  };


  //################  function propes
  declare interface SearchParamProps {
    params?: Promise<SegmentParams>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
  declare interface UploadFileProps {
    file: File;
    userId: string;
  }
  declare interface GetFilesProps {
    userId: string,
    types: FileType[];
    searchText?: string;
    sort?: string;
    limit?: number;
  }
  declare interface RenameFileProps {
    fileId: string;
    name: string;
  }
  declare interface UpdateFileUsersProps {
    fileId: string;
    emails: string[];
    path: string;
  }
  declare interface DeleteFileProps {
    fileId: string;
    bucketFileId: string;
    path: string;
  }
  declare interface FileUploaderProps {
    ownerId: string;
    accountId: string;
    className?: string;
  }
  declare interface MobileNavigationProps {
    ownerId: string;
    accountId: string;
    fullName: string;
    avatar: string;
    email: string;
  }
  declare interface SidebarProps {
    fullName: string;
    avatar: string;
    email: string;
  }
  declare interface ThumbnailProps {
    type: string;
    extension: string;
    url: string;
    className?: string;
    imageClassName?: string;
  }
  declare interface ShareInputProps {
    file: Models.Document;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (email: string) => void;
  }
  //################ Authentication Users
  declare interface User {
    id: string;
    fullname: string;
    email: string;
    avatar: string;
    logInMethod: "OAuth" | "credential";
  }
  declare interface Passwords {
    id: string;
    hash: string;
  }


}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      fullname: string;
      email: string;
      avatar: string;
      logInMethod: "OAuth" | "credential";
    };
  }

  interface User {
    id: string;
    fullname: string;
    email: string;
    avatar: string;
    logInMethod: "OAuth" | "credential";
  }
}