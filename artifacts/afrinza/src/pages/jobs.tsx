import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Briefcase, MapPin, Search, X, Phone, Mail, Clock, CheckCircle2,
  Building2, Wallet, ListChecks,
} from "lucide-react";
import type { JobListing } from "@/lib/supabase-db";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES_BY_COUNTRY, LOCATION_COUNTRIES } from "@/lib/malaysia-locations";
import { useAuthContext } from "@/contexts/auth-context";
import { useGetJobListings, useCreateJobListing } from "@/hooks/use-marketplace";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const JOB_CATEGORIES = [
  "Food & Beverage", "Retail", "Delivery & Logistics", "Admin & Office",
  "IT & Tech", "Education", "Healthcare", "Construction", "Hospitality", "Other",
];

const jobSchema = z.object({
  posterName: z.string().min(2, "Your name is required"),
  companyName: z.string().min(2, "Company / business name is required"),
  whatsapp: z.string()
    .min(1, "WhatsApp number is required")
    .refine((v) => /^\+?[0-9]{8,15}$/.test(v.replace(/[\s\-()]/g, "")), "Enter a valid number, e.g. +60123456789"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  location: z.string().min(1, "Location is required"),
  jobTitle: z.string().min(3, "Give the position a title, e.g. 'Kitchen Assistant'"),
  jobType: z.string().min(1, "Select a job type"),
  category: z.string().min(1, "Select a category"),
  salaryRange: z.string().optional(),
  description: z.string().min(10, "Describe the role for candidates"),
  requirements: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function Jobs() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const [, setLocation] = useLocation();

  const [jobTab, setJobTab] = useState<"find" | "post">("find");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchedLocation, setSearchedLocation] = useState<string | undefined>(undefined);
  const [formCountry, setFormCountry] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const jobListings = useGetJobListings(undefined);
  const createJobListing = useCreateJobListing();

  const filteredJobs = jobListings.data
    ? searchedLocation
      ? jobListings.data.filter((j) => j.location?.toLowerCase().includes(searchedLocation.toLowerCase()))
      : jobListings.data
    : [];

  useEffect(() => {
    if (jobTab === "post" && !authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [jobTab, authLoading, isAuthenticated, setLocation]);

  const jobForm = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      posterName: "", companyName: "", whatsapp: "", email: "", location: "",
      jobTitle: "", jobType: "", category: "", salaryRange: "", description: "", requirements: "",
    },
  });

  const goToPostTab = () => {
    if (!isAuthenticated) { setLocation("/auth"); return; }
    setJobTab("post");
  };

  const onSubmit = async (data: JobFormValues) => {
    if (!user?.id) { setLocation("/auth"); return; }
    try {
      await createJobListing.mutateAsync({
        userId: user.id,
        posterName: data.posterName,
        companyName: data.companyName,
        whatsapp: data.whatsapp,
        email: data.email || undefined,
        location: data.location,
        jobTitle: data.jobTitle,
        jobType: data.jobType,
        category: data.category,
        salaryRange: data.salaryRange || undefined,
        description: data.description,
        requirements: data.requirements || undefined,
      });
      setIsSuccess(true);
      jobForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post job. Please try again.");
    }
  };

  const resetSuccess = () => setIsSuccess(false);

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Job Posted for Review!</h1>
        <p className="text-muted-foreground mb-8">
          Thanks for posting on Afrinza. Your job listing has been submitted and will go live once our team
          reviews and approves it — usually within 24 hours.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" className="rounded-full" onClick={() => { setJobTab("find"); resetSuccess(); }}>
            Browse Jobs
          </Button>
          <Button className="rounded-full" onClick={() => { goToPostTab(); resetSuccess(); }}>
            Post Another Job
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/10">
      {/* Header */}
      <div className="bg-primary text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <Briefcase className="w-10 h-10 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-3">Jobs on Afrinza</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Find job opportunities posted by fellow Africans and businesses across Malaysia — or post an opening
            for your own team.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-7">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-border rounded-2xl p-1.5 shadow-sm mb-8 w-fit mx-auto">
          <button
            onClick={() => setJobTab("find")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${jobTab === "find" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Search className="w-4 h-4" /> Find Jobs
          </button>
          <button
            onClick={goToPostTab}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${jobTab === "post" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Briefcase className="w-4 h-4" /> Post a Job
          </button>
        </div>

        {/* ── FIND JOBS ─────────────────────────────────────────── */}
        {jobTab === "find" && (
          <div className="max-w-5xl mx-auto pb-16">
            <form
              onSubmit={(e) => { e.preventDefault(); setSearchedLocation(selectedLocation || undefined); }}
              className="flex gap-2 mb-8 max-w-lg mx-auto"
            >
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by city or area…"
                  className="pl-9 h-11 rounded-full bg-white"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                />
              </div>
              <Button type="submit" className="rounded-full px-6">Search</Button>
              {searchedLocation && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSelectedLocation(""); setSearchedLocation(undefined); }}
                  className="rounded-xl px-3 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </form>

            {jobListings.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : jobListings.error ? (
              <div className="text-center py-16 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">Could not load job listings</p>
                <p className="text-sm mt-1">Run <code className="bg-muted px-1 rounded text-xs">015_jobs.sql</code> in your Supabase SQL Editor.</p>
              </div>
            ) : !jobListings.data || jobListings.data.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-white rounded-3xl border border-border shadow-sm">
                <Briefcase className="w-14 h-14 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg mb-2">No jobs posted yet</p>
                <p className="text-sm mb-6">Be the first to post an opportunity for the community.</p>
                <Button onClick={goToPostTab} className="rounded-full gap-2">
                  <Briefcase className="w-4 h-4" /> Post a Job
                </Button>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-white rounded-3xl border border-border shadow-sm">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg mb-1">No jobs in "{searchedLocation}"</p>
                <p className="text-sm mb-5">Try a different city or area.</p>
                <Button variant="outline" onClick={() => { setSelectedLocation(""); setSearchedLocation(undefined); }} className="rounded-full gap-2">
                  <X className="w-4 h-4" /> Clear Search
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} {searchedLocation ? `in "${searchedLocation}"` : "available"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col p-5 cursor-pointer" onClick={() => setSelectedJob(job)}>
                      <div className="flex items-start gap-2 mb-1">
                        <h3 className="font-bold text-foreground leading-tight flex-1">{job.jobTitle}</h3>
                        <Badge className="shrink-0 bg-primary/10 text-primary border-transparent text-[10px]">{job.jobType}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5 shrink-0" /> {job.companyName}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {job.location}
                      </div>
                      {job.salaryRange ? (
                        <div className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-primary" /> {job.salaryRange}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-muted-foreground mb-2 italic">Salary negotiable</div>
                      )}
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium w-fit mb-2">{job.category}</span>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{job.description}</p>
                      <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="flex items-center justify-center gap-1.5 flex-1 border border-border rounded-full py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                        >
                          View Details
                        </button>
                        <a
                          href={`https://wa.me/${job.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full py-2 text-xs font-semibold transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-10 bg-primary/5 border border-primary/20 rounded-3xl p-6 text-center">
              <Briefcase className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="font-bold text-lg mb-1">Hiring for your business?</p>
              <p className="text-sm text-muted-foreground mb-4">Post a job opening and reach Africans across Malaysia looking for work.</p>
              <Button onClick={goToPostTab} className="rounded-full gap-2">
                <Briefcase className="w-4 h-4" /> Post a Job
              </Button>
            </div>
          </div>
        )}

        {/* ── POST A JOB ────────────────────────────────────────── */}
        {jobTab === "post" && isAuthenticated && (
          <div className="max-w-3xl mx-auto pb-16">
            <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
              <div className="p-6 md:p-10">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Post a Job Opportunity</h2>
                    <p className="text-muted-foreground text-sm">Your listing will be reviewed by our team before it goes live to job seekers.</p>
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="mb-7 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Signed in as <strong>{user?.email}</strong> — your account is already linked.
                  </div>
                )}

                <div className="mb-7 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  New job posts require admin approval and won't be visible to job seekers until approved.
                </div>

                <Form {...jobForm}>
                  <form onSubmit={jobForm.handleSubmit(onSubmit)} className="space-y-7">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={jobForm.control} name="posterName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Full Name</FormLabel>
                          <FormControl><Input placeholder="John Okafor" className="h-12 bg-muted/30" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={jobForm.control} name="companyName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company / Business Name</FormLabel>
                          <FormControl><Input placeholder="Afrinza Foods Sdn Bhd" className="h-12 bg-muted/30" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={jobForm.control} name="whatsapp" render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number</FormLabel>
                          <FormControl><Input placeholder="+60123456789" className="h-12 bg-muted/30" {...field} /></FormControl>
                          <FormDescription className="text-xs">Candidates will contact you directly on this number.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={jobForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email <span className="font-normal text-xs text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl><Input type="email" placeholder="hr@company.com" className="h-12 bg-muted/30" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={jobForm.control} name="jobTitle" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl><Input placeholder="Kitchen Assistant" className="h-12 bg-muted/30" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={jobForm.control} name="jobType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select job type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={jobForm.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {JOB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={jobForm.control} name="salaryRange" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Range <span className="font-normal text-xs text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl><Input placeholder="RM 2,000 - RM 3,000 / month" className="h-12 bg-muted/30" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Country</label>
                        <Select value={formCountry} onValueChange={(v) => { setFormCountry(v); jobForm.setValue("location", ""); }}>
                          <SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select country" /></SelectTrigger>
                          <SelectContent className="max-h-60">
                            {LOCATION_COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormField control={jobForm.control} name="location" render={({ field }) => (
                        <FormItem>
                          <FormLabel>City / State</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!formCountry}>
                            <FormControl><SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder={formCountry ? "Select city" : "Select country first"} /></SelectTrigger></FormControl>
                            <SelectContent className="max-h-60">
                              {(CITIES_BY_COUNTRY[formCountry] ?? []).map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={jobForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl><Textarea placeholder="Describe the role, responsibilities, and work hours…" className="min-h-28 bg-muted/30" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={jobForm.control} name="requirements" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirements <span className="font-normal text-xs text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl><Textarea placeholder="Qualifications, experience, language skills…" className="min-h-20 bg-muted/30" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button type="submit" size="lg" className="w-full rounded-full h-13 gap-2" disabled={createJobListing.isPending}>
                      {createJobListing.isPending ? "Posting…" : (<><Briefcase className="w-4 h-4" /> Submit Job for Review</>)}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Detail Sheet */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => { if (!open) setSelectedJob(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedJob && (
            <div className="space-y-5">
              <SheetHeader>
                <div className="flex items-start gap-2">
                  <SheetTitle className="text-xl font-bold leading-tight flex-1">{selectedJob.jobTitle}</SheetTitle>
                  <Badge className="shrink-0 bg-primary/10 text-primary border-transparent text-xs">{selectedJob.jobType}</Badge>
                </div>
              </SheetHeader>

              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4 shrink-0" /> {selectedJob.companyName}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 -mt-3">
                <MapPin className="w-4 h-4 shrink-0" /> {selectedJob.location}
              </p>

              {selectedJob.salaryRange && (
                <div className="bg-muted/30 rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground mb-0.5">Salary</p>
                  <p className="text-lg font-bold text-foreground flex items-center gap-1.5"><Wallet className="w-4 h-4 text-primary" /> {selectedJob.salaryRange}</p>
                </div>
              )}

              <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium w-fit inline-block">{selectedJob.category}</span>

              <div>
                <p className="font-semibold text-sm mb-1.5">Description</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements && (
                <div>
                  <p className="font-semibold text-sm mb-1.5 flex items-center gap-1.5"><ListChecks className="w-4 h-4" /> Requirements</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://wa.me/${selectedJob.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full py-3 text-sm font-semibold transition-colors"
                >
                  <Phone className="w-4 h-4" /> WhatsApp
                </a>
                {selectedJob.email && (
                  <a
                    href={`mailto:${selectedJob.email}`}
                    className="flex items-center justify-center gap-2 flex-1 border border-border rounded-full py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Email
                  </a>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
