import Link from "next/link";
import ActionDropdown from "@/components/ActionDropdown";
import { Chart } from "@/components/Chart";
import FormattedFileSize from "@/components/FormattedFileSize";
import { Thumbnail } from "@/components/Thumbnail";
import { getAllFilesSizes, getFiles, getFileSize, getTotalSpaceUsed } from "@/app/lib/actions/file.actions";
import { convertFileSize, getFileType, getUsageSummary } from "@/lib/utils";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import path from "path";
import { Separator } from "@radix-ui/react-separator";
import Image from "next/image";

const Dashboard = async () => {
  const session = await auth();
  if (!session) throw Error("User not authenticated!");

  const files = await getFiles(
    {
      userId: session.user.id,
      types: [],
      searchText: "",
    }
  )

  const totalUsedSpace = await getTotalSpaceUsed({ userId: session.user.id })
  if (!files?.success) return notFound();

  const fileNames = files.data as string[];

  // Get usage summary
  const usageSummary = await getUsageSummary(fileNames, session.user.id);
  return (
    <div className="dashboard-container">
      <section>
        {totalUsedSpace.success &&

          <Chart used={totalUsedSpace.data as number} />
        }

        {/* Uploaded file type summaries */}
        {
          <ul className="dashboard-summary-list">
            {usageSummary.map((summary) => (
              <Link
                href={summary.url}
                key={summary.title}
                className="dashboard-summary-card"
              >
                <div className="space-y-4">
                  <div className="flex justify-between gap-3">
                    <Image
                      src={summary.icon}
                      width={100}
                      height={100}
                      alt="uploaded image"
                      className="summary-type-icon"
                    />
                  </div>

                  <h5 className="summary-type-title">{summary.title}</h5>
                  <Separator className="bg-light-400" />
                  <FormattedFileSize
                    sizeInBytes={summary.size}
                    className="text-center"
                  />
                </div>
              </Link>
            ))}
          </ul>
        }
      </section>

      {/* Recent files uploaded */}
      {
        <section className="dashboard-recent-files">
          <h2 className="h3 xl:h2 text-light-100">Recent files uploaded</h2>
          {fileNames.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-5">
              {(files.data as string[]).map(async (file: string) => {

                const filePath = path.join('/uploads', session.user.id, file);
                const fileSize = await getFileSize({ userId: session.user.id, fileName: file })


                return (
                  <Link
                    href={path.join("api", "uploads", session.user.id, file)}
                    target="_blank"
                    className="flex items-center gap-3"
                    key={file}
                  >
                    <Thumbnail
                      type={getFileType(file).type}
                      extension={getFileType(file).extension}
                      url={filePath}
                    />

                    <div className="recent-file-details">
                      <div className="flex flex-col gap-1">
                        <p className="recent-file-name">{file}</p>

                        {
                          fileSize.success && (
                            <FormattedFileSize
                              sizeInBytes={fileSize.data as number}
                              className="caption"
                            />
                          )
                        }

                      </div>
                      <ActionDropdown file={
                        {
                          $collectionId: "",
                          $createdAt: "null",
                          $databaseId: "",
                          $id: "null",
                          $updatedAt: "",
                          $permissions: ["null"]
                        }
                      } />
                    </div>
                  </Link>
                )
              })}
            </ul>
          ) : (
            <p className="empty-list">No files uploaded</p>
          )}
        </section>
      }
    </div>
  );
};

export default Dashboard;

//todo : implement search.


//todo : add limit for uploads (the user should only upload a file with size of less than remaining storage)
//todo : show a success dialog when upload was successfull.
//todo : handle limit for getting files from server(when the count of files increased.)


//todo : implement main dashboard file 
//todo : implement file categories pages.
