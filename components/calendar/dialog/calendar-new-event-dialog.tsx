import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCalendarContext } from '../calendar-context'
import { format } from 'date-fns'
import { DateTimePicker } from '@/components/form/date-time-picker'
import { ColorPicker } from '@/components/form/color-picker'
import { colorOptions } from "@/components/calendar/calendar-tailwind-classes"
import { Loader } from 'lucide-react'

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isAllDay: z.boolean().catch(false), // ✅ always boolean
  color: z.enum(colorOptions.map((c : any) => c.value) as [string, ...string[]]), // ✅ enum of allowed values
  projectId: z.string(),
});

export default function CalendarNewEventDialog({projectId}: {projectId: string}) {
  const { newEventDialogOpen, setNewEventDialogOpen, date, events, setEvents } =
    useCalendarContext();


    const [loading , setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      startTime: format(date, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(date, "yyyy-MM-dd'T'HH:mm"),
      isAllDay: false,
      color: colorOptions[0].value,
      projectId: projectId
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const res = await fetch("/api/calendar/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      console.error("Failed to create calendar item");
      return;
    }
    
    const { data } = await res.json();
    setEvents([...events, data]);
    setLoading(false);
    setNewEventDialogOpen(false);
    form.reset();
  }

  return (
    <Dialog open={newEventDialogOpen} onOpenChange={setNewEventDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Start */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start</FormLabel>
                  <FormControl>
                    <DateTimePicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End</FormLabel>
                  <FormControl>
                    <DateTimePicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorPicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
               <Button type="submit" disabled={loading}>
                {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Creating..." : "Create event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
