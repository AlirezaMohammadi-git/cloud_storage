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
  const [error, setError] = useState({ error: "", fileName: "" })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
      acceptedFiles.forEach(async (file) => {
        try {
          const result = await uploadFile({ file: file, userId: userId });
          if (result.success) {
            setFiles(prev => {
              return prev.filter(file => file.name !== result.data as string)
            })
          } else {
            setError({ error: result?.error, fileName: file.name })
          }
        } catch (err) {
          console.error(err);
          setError({ error: `Something went wrong.`, fileName: file.name })
        }
      })
    },
    [path],
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


  // show error message to user :
  useEffect(() => {

    if (error) {
      setFiles(prev => prev.filter(file => file.name !== error.fileName))
      toast(error.fileName, {
        description: error.error,
        position: "top-center",
        className: "error-toast",
        onAutoClose: () => setFiles(prev => prev.filter(file => file.name !== error.fileName)),
        action: {
          label: "Ok",
          onClick: () => {
            setFiles(prev => prev.filter(file => file.name !== error.fileName))
          }
        }
      })
    }

  }, [error])

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
