'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NameForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Check if the new name is the same as the old name
    if (e.currentTarget.fullName.value === userName) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }
    handleRequest(e, updateName, router);
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Name</CardTitle>
        <CardDescription>
          Please enter your full name, or a display name you are comfortable
          with.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-8 mb-4 text-xl font-semibold">
          <form id="nameForm" onSubmit={(e) => handleSubmit(e)}>
            <input
              type="text"
              name="fullName"
              className="w-1/2 p-3 rounded-md bg-zinc-800"
              defaultValue={userName}
              placeholder="Your name"
              maxLength={64}
            />
          </form>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0">64 characters maximum</p>
          <Button
            variant="outline"
            type="submit"
            form="nameForm"
            disabled={isSubmitting}
          >
            Update Name
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
