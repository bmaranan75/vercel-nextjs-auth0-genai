import { Toaster } from 'sonner';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { ReactNode } from 'react';
import { ShoppingCart, FileText, Share } from 'lucide-react';

import { getDocumentsForUser } from '@/lib/actions/documents';
import DocumentUploadForm from '@/components/document-upload-form';
import DocumentItemActions from '@/components/document-item-actions';
import { auth0 } from '@/lib/auth0';

export default async function DocumentsPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] my-auto gap-4 p-8">
        <div className="bg-safeway-red p-3 rounded-xl">
          <ShoppingCart className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl text-safeway-dark-gray">Please sign in to view your shopping lists</h2>
      </div>
    );
  }

  // Fetch documents for the current user
  const documents = await getDocumentsForUser();

  // This Server Action will be used for revalidation after any successful document action
  async function handleDocumentActionComplete() {
    'use server';
    console.log('Document action complete, revalidating /documents');
    revalidatePath('/documents');
  }

  function getSharingStatus(sharedWith: string[] | null): ReactNode {
    if (!sharedWith || sharedWith.length === 0) {
      return (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Private list
        </p>
      );
    }
    if (sharedWith.includes(user?.email!)) {
      return (
        <p className="text-sm text-safeway-green font-medium flex items-center gap-1">
          <Share className="h-3 w-3" />
          Shared with you
        </p>
      );
    }
    return (
      <p className="text-sm text-safeway-red flex items-center gap-1">
        <Share className="h-3 w-3" />
        Shared with: {sharedWith.join(', ')}
      </p>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* Section for Creating New Shopping Lists */}
      <section className="mb-12">
        <div className="safeway-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-safeway-red p-2 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-safeway-dark-gray">Create New Shopping List</h2>
          </div>
          <DocumentUploadForm onUploadSuccess={handleDocumentActionComplete} />
        </div>
      </section>
      <h1 className="text-2xl font-bold mb-8 text-safeway-dark-gray flex items-center gap-3">
        <FileText className="h-6 w-6 text-safeway-red" />
        My Shopping Lists
      </h1>

      {/* Section for Listing Existing Shopping Lists */}
      <section>
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Shopping list cards will be rendered here */}
            {documents.map((doc) => (
              <div key={doc.id} className="safeway-card p-5 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-safeway-red" />
                    <h3 className="font-semibold text-lg text-safeway-dark-gray">{doc.fileName}</h3>
                  </div>
                  <p className="text-sm text-safeway-dark-gray/70 mb-1">Type: {doc.fileType}</p>
                  <p className="text-sm text-safeway-dark-gray/70 mb-2">
                    Created: {doc.createdAt ? format(doc.createdAt, 'MMM dd, yyyy') : 'N/A'}
                  </p>
                  {getSharingStatus(doc.sharedWith)}
                </div>
                <DocumentItemActions
                  doc={doc}
                  onActionComplete={handleDocumentActionComplete} // Pass the revalidation action
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-safeway-light-gray p-8 rounded-xl max-w-md mx-auto">
              <ShoppingCart className="h-12 w-12 text-safeway-red mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-safeway-dark-gray mb-2">No shopping lists yet</h3>
              <p className="text-safeway-dark-gray/70">
                Create your first shopping list to get started with organized shopping!
              </p>
            </div>
          </div>
        )}
      </section>
      <Toaster richColors />
    </div>
  );
}
