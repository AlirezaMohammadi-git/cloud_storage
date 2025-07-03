import Link from "next/link";
import ActionDropdown from "@/components/ActionDropdown";
import { Chart } from "@/components/Chart";
import FormattedFileSize from "@/components/FormattedFileSize";
import { Thumbnail } from "@/components/Thumbnail";
import { getFiles, getFileSize, getTotalSpaceUsed, getUsageSummary, createFileUrl } from "@/app/lib/actions/file.actions";
import { getFileType } from "@/lib/utils";
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
  const fileNames = files.data as FileMeataData[];
  // Get usage summary
  const usageSummary = await getUsageSummary(fileNames, session.user.id);



  return (
    <div className="dashboard-container">
      {/* Uploaded file type summaries */}
      <section>
        {totalUsedSpace.success &&
          <Chart used={totalUsedSpace.data as number} />
        }
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
              {(files.data as FileMeataData[]).map(async (file: FileMeataData) => {

                const fileSize = await getFileSize({ userId: session.user.id, fileName: file.name })
                const fileURL = await createFileUrl(session.user.id, file.name);


                return (
                  <Link
                    href={fileURL}
                    target="_blank"
                    className="flex items-center gap-3"
                    key={file.id}
                  >
                    <Thumbnail
                      type={(file).type}
                      extension={getFileType(file.name).extension}
                      url={file.url}
                    />

                    <div className="recent-file-details">
                      <div className="flex flex-col gap-1">
                        <p className="recent-file-name">{file.name}</p>

                        {
                          fileSize.success && (
                            <FormattedFileSize
                              sizeInBytes={fileSize.data as number}
                              creationDate={file.dateAdded}
                              className="caption"
                            />
                          )
                        }

                      </div>
                      <ActionDropdown file={file} />
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
