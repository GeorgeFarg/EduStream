import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileIcon, Download, Upload } from 'lucide-react';

export default function AssignmentDetailPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Calculus Problem Set 5</h1>
            <p className="text-muted-foreground mt-2">Posted by Dr. Sarah Johnson</p>
          </div>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
            Submitted
          </Badge>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <div className="prose prose-invert max-w-none">
              <p>
                Complete problems 1-15 from Chapter 5. This problem set covers:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>Fundamental Theorem of Calculus</li>
                <li>Integration by substitution</li>
                <li>Integration by parts</li>
                <li>Applications to area and volume</li>
              </ul>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Materials</h2>
            <div className="space-y-2">
              <a href="#" className="flex items-center gap-3 p-3 hover:bg-muted rounded transition">
                <FileIcon className="w-5 h-5 text-primary" />
                <span className="flex-1">Problem Set 5 PDF</span>
                <Download className="w-4 h-4 text-muted-foreground" />
              </a>
              <a href="#" className="flex items-center gap-3 p-3 hover:bg-muted rounded transition">
                <FileIcon className="w-5 h-5 text-primary" />
                <span className="flex-1">Solution Hints Document</span>
                <Download className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Submission */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Your Submission</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Submitted on April 28, 2025</p>
                <a href="#" className="flex items-center gap-3 p-3 bg-muted rounded hover:bg-muted/80 transition">
                  <FileIcon className="w-5 h-5 text-primary" />
                  <span className="flex-1">Problem Set 5 Solution.pdf</span>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Resubmit
              </Button>
            </div>
          </div>

          {/* Grading */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Grading</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="text-3xl font-bold text-primary mt-1">92%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Feedback from Dr. Sarah Johnson</p>
                <p className="bg-muted p-4 rounded text-sm">
                  Excellent work! Your solutions are clear and well-organized. I particularly appreciated your creative approach to problem 12. Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Due Date Card */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">DUE DATE</p>
            <p className="text-lg font-semibold">April 30, 2025</p>
            <p className="text-xs text-green-400 mt-2">Submitted on time</p>
          </div>

          {/* Points Card */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">POINTS</p>
            <p className="text-lg font-semibold">92 / 100</p>
          </div>

          {/* Status Card */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">STATUS</p>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 w-full justify-center">
              Graded
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
