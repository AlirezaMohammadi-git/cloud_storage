"use client";

import React, { useCallback, useEffect, useState } from "react";

import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { convertFileToUrl, getFileType } from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { usePathname } from "next/navigation";
import { uploadFile } from "@/app/lib/actions/file.actions";
import { toast } from "sonner";

const FileUploader = ({ userId }: { userId: string }) => {
  const [files, setFiles] = useState<File[]>([]);
  const path = usePathname();
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "error" });

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

  useEffect(() => {

    // showToast.show prevent repead
    if (showToast.show) {
      if (showToast.type === "success") {
        toast.success(
          showToast.message, {
          className: "success-toast",
          position: "top-center",
          action: {
            label: "OK",
            onClick: () => { }
          }
        }
        )
      } else if (showToast.type === "error") {
        toast.error(
          showToast.message, {
          position: "top-center",
          className: "error-toast",
          action: {
            label: "OK",
            onClick: () => { }
          }
        }
        )
      }
    }

  }, [showToast])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // show files as toast
      setFiles(acceptedFiles);
      acceptedFiles.forEach(async (file) => {
        try {
          const result = await uploadFile({ file: file, userId: userId });
          if (result.success) {
            setFiles((prev) => {
              return prev.filter((toastFile) => toastFile.name !== file.name);
            });
            setShowToast({ show: true, message: `"${file.name}" uploaded successfully!`, type: "success" })
          } else {
            setShowToast({ show: true, message: `"${file.name}" :${result.error}`, type: "error" })
            setFiles((prev) => {
              return prev.filter((toastFile) => toastFile.name !== file.name);
            });
          }
        } catch (err) {
          console.error(err);
          setFiles((prev) => {
            return prev.filter((toastFile) => toastFile.name !== file.name);
          });
          setShowToast({ show: true, message: `Error while uploading "${file.name}"`, type: "error" })
        }
      })
    },
    [path],
  );

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
