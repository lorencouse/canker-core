'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User } from '@/types';
import { updateUserProfile } from '@/utils/auth-helpers/server';

const profileFormSchema = z.object({
  username: z.string().min(2).max(30),
  email: z.string().email(),
  full_name: z.string().min(2).max(50),
  bio: z.string().max(160).optional(),
  phone: z.string().optional()
  // language: z.string().optional()
  // Add other fields as needed
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ContactInfoForm({ userProfile }: { userProfile: User | null }) {
  const [loading, setLoading] = useState(false);
  const [buttonText, setButtonText] = useState('Update');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: userProfile?.username || '',
      email: userProfile?.email || '',
      full_name: userProfile?.full_name || '',
      bio: userProfile?.bio || ''
      // Initialize other fields
    },
    mode: 'onChange'
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    setButtonText('Updating...');
    const { message: error } = await updateUserProfile(data);
    if (error) {
      setButtonText('Error Updating');
      setLoading(false);
      setError(error);
      setTimeout(() => setButtonText('Update'), 3000);
      return;
    }
    setButtonText('Success!');
    setTimeout(() => setButtonText('Update'), 2000);
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a
                pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormDescription>Your primary email address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        {/* <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Language</FormLabel>
              <FormControl>
                <Input placeholder="English" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        {/* Add other form fields as needed */}
        <Button type="submit" disabled={loading}>
          {buttonText}
        </Button>
        {error && <span className="text-red-500">{error}</span>}
      </form>
    </Form>
  );
}
