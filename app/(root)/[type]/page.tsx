import React from "react";
import Sort from "@/components/Sort";
import { getFiles, getSharedFiles } from "@/app/lib/actions/file.actions";
import Card from "@/components/Card";
import { convertFileSize, getFileTypesParams } from "@/lib/utils";
import { auth } from "@/auth";
import { getUserNameById } from "@/app/lib/actions/user.db.actions";

const Page = async ({ searchParams, params }: SearchParamProps) => {
  const type = ((await params)?.type as FileType) || "";
  const searchText = ((await searchParams)?.query as string) || "";
  const sort = ((await searchParams)?.sort as string) || "";
  const types = getFileTypesParams(type) as FileType[];
  const session = await auth();
  if (!session) return null;

  let filesResult;
  if (type === "shared") {

    filesResult = await getSharedFiles(session.user.email, sort)

  } else {
    filesResult = await getFiles({
      user: session.user,
      types: types,
      searchText: searchText,
      sort: sort,
      shared: true
    });
  }

  if (!filesResult.success) return (<p className="shad-form-message w-full text-center">{`${filesResult.error}`}</p>)

  const files = (filesResult.data) as FileMetadata[];
  const totalFilesSize = files
    .map(file => Number(file.size))
    .reduce((prev, crr) => prev + crr, 0)

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1 capitalize">{type}</h1>

        <div className="total-size-section">
          <p className="body-1">
            Total: <span className="h5">{convertFileSize(totalFilesSize, 2)}</span>
          </p>

          <div className="sort-container">
            <p className="body-1 hidden text-light-200 sm:block">Sort by:</p>

            <Sort />
          </div>
        </div>
      </section>

      {/* Render the files */}
      {files.length > 0 ? (
        <section className="file-list">
          {files.map(async (file: FileMetadata) => {

            const fileOwner = await getUserNameById(file.owner, session.user)
            return (
              <Card key={file.id} file={file} currentUser={session.user} owner={fileOwner} />
            )
          })}
        </section>
      ) : (
        <p className="empty-list">No files uploaded</p>
      )}
    </div>
  );
};

export default Page;
