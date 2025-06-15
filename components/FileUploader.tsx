"use client";

import React, { useCallback, useState } from "react";

import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { convertFileToUrl, getFileType } from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { MAX_FILE_SIZE } from "@/constants";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { uploadFile } from "@/lib/actions/file.actions";

interface Props {
  ownerId: string;
  accountId: string;
  className?: string;
}

const FileUploader = ({ ownerId, accountId, className }: Props) => {
  const [files, setFiles] = useState<File[]>([]);
  const path = usePathname();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Do something with the files
      console.log(acceptedFiles[0].type);
      setFiles(acceptedFiles);

      //fixme: check if file is already uploaded. (network error in previous upload)
      try {
        const uploadPromise = acceptedFiles.map(async (f) => {
          if (f.size > MAX_FILE_SIZE) {
            setFiles((prev) => prev.filter((file) => file.name !== f.name));
            return toast("", {
              description: (
                <p className="body-2 text-white">
                  <span className="font-semibold">{f.name}</span>
                  {` is too large. Max file size is ${MAX_FILE_SIZE / 1000000} MB.`}
                </p>
              ),
              duration: 5000,
              className: "error-toast",
            });
          }

          // uploading file:
          return await uploadFile({
            file: f,
            ownerId,
            accountId,
            path,
          }).then((res) => {
            if (res.success) {
              setFiles((prev) => prev.filter((file) => file.name !== f.name));
              toast.success("", {
                description: (
                  <p className="body-2 text-green">
                    <span className="font-semibold">{f.name}</span>
                    {" uploaded successfully."}
                  </p>
                ),
                duration: 5000,
              });
            } else {
              setFiles((prev) => prev.filter((file) => file.name !== f.name));
              toast.error("", {
                description: (
                  <p className="body-2 text-error">
                    <span className="font-semibold text-black">{f.name}</span>
                    {" failed to upload."}
                  </p>
                ),
                duration: 5000,
              });
            }
          });
        });
        await Promise.all(uploadPromise);
      } catch (err) {
        setFiles([]);
        toast.error("", {
          description: (
            <p className="body-2 text-black">
              <span className="font-semibold text-error">Error:</span>
              {`Failed to upload file.`}
            </p>
          ),
          duration: 5000,
        });
      }
    },
    [path, ownerId, accountId],
  );

  const handleRemoveFile = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
    fileName: string,
  ) => {
    // stop clicking on below element and prevent openning file picker.
    e.stopPropagation();
    setFiles((prev) => {
      return prev.filter((file) => file.name !== fileName);
    });
  };

  // if user drag a file over returned HTML, then isDragActive will be true.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        <Button className="uploader-button cursor-pointer">
          <Image
            src="/assets/icons/upload.svg"
            alt="upload"
            width={24}
            height={24}
          />
          <p>{isDragActive ? "Drop to upload" : "Upload"}</p>
        </Button>
      }

      {files.length > 0 && (
        <ul className="uploader-preview-list">
          {files.map((file, index) => {
            const { type, extension } = getFileType(file.name);

            return (
              <li
                key={`${file.name}-${index}`}
                className="uploader-preview-item"
              >
                <div className="flex items-center gap-4">
                  <Thumbnail
                    type={type}
                    extension={extension}
                    url={convertFileToUrl(file)}
                  />

                  <div className="flex flex-col">
                    <p className="preview-item-name">
                      {file.name}

                      <Image
                        src="/assets/icons/file-loader.gif"
                        alt="loader"
                        width={100}
                        height={26}
                      />
                    </p>
                  </div>
                </div>

                <Image
                  src="/assets/icons/remove.svg"
                  alt="remove icon"
                  width={24}
                  height={24}
                  onClick={(e) => handleRemoveFile(e, file.name)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
