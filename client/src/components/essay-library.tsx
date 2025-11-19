import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Essay } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Share, MoreVertical, Check, Clock, Globe, FileText, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface EssayLibraryProps {
  onEditEssay?: (essayId: string) => void;
  onViewEssay?: (essayId: string) => void;
}

export function EssayLibrary({ onEditEssay , onViewEssay}: EssayLibraryProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: essays = [], isLoading } = useQuery({
    queryKey: [`/api/essays?authorId=${user?.id}`],
    enabled: !!user?.id,
  });

  const filteredEssays = (essays as Essay[]).filter((essay: Essay) => {
    const matchesSearch = essay.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         essay.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeFilter) {
      case "drafts":
        return matchesSearch && !essay.isAnalyzed && !essay.isPublic;
      case "published":
        return matchesSearch && essay.isPublic;
      case "analyzed":
        return matchesSearch && essay.isAnalyzed;
      default:
        return matchesSearch;
    }
  });

  const deleteEssayMutation = useMutation({
    mutationFn: async (essayId: string) => {
      return apiRequest("DELETE", `/api/essays/${essayId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/essays?authorId=${user?.id}`] });
      toast({
        title: "Essay deleted",
        description: "The essay has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete essay. Please try again.",
        variant: "destructive",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ essayId, isPublic }: { essayId: string; isPublic: boolean }) => {
      return apiRequest("PUT", `/api/essays/${essayId}`, { isPublic });
    },
    onSuccess: async (response) => {
      const updatedEssay = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/essays"] });
      toast({
        title: updatedEssay.isPublic ? "Essay published" : "Essay unpublished",
        description: updatedEssay.isPublic 
          ? "Your essay is now visible to the community."
          : "Your essay is now private.",
      });
    },
    onError: () => {
      toast({
        title: "Action failed",
        description: "Failed to update essay visibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (essay: Essay) => {
    if (essay.isPublic) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 text-xs rounded-full">
          <Globe className="w-3 h-3 mr-1 inline" />
          Published
        </span>
      );
    } else if (essay.isAnalyzed) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs rounded-full">
          <Check className="w-3 h-3 mr-1 inline" />
          Analyzed
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 text-xs rounded-full">
          <Clock className="w-3 h-3 mr-1 inline" />
          Draft
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full mb-4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">My Essay Library</h2>
          <p className="text-muted-foreground">Manage and review your written essays</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search essays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
              data-testid="input-search"
            />
          </div>
          <Button onClick={() => onEditEssay?.("")} data-testid="button-new-essay">
            <Plus className="w-4 h-4 mr-2" />
            New Essay
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1 mb-6 w-fit">
        {[
          { key: "all", label: "All Essays" },
          { key: "drafts", label: "Drafts" },
          { key: "published", label: "Published" },
          { key: "analyzed", label: "Analyzed" },
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter(filter.key)}
            className={activeFilter === filter.key ? "shadow-sm" : ""}
            data-testid={`filter-${filter.key}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Essays Grid */}
      {filteredEssays.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No essays found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search terms." : "Start writing your first essay!"}
            </p>
            {!searchQuery && (
              <Button onClick={() => onEditEssay?.("")} data-testid="button-create-first">
                <Plus className="w-4 h-4 mr-2" />
                Create Essay
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEssays.map((essay: Essay) => (
            <Card key={essay.id} className="hover:shadow-md transition-shadow" data-testid={`essay-card-${essay.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">
                    {essay.title}
                  </h3>
                  <div className="flex items-center space-x-1">
                      {/*<Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      onClick={() => togglePublishMutation.mutate({
                        essayId: essay.id,
                        isPublic: !essay.isPublic
                      })}
                      disabled={togglePublishMutation.isPending}
                      data-testid={`button-share-${essay.id}`}
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                  
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      data-testid={`button-menu-${essay.id}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button> */}
                    <Button
                    variant="ghost" 
                    size="sm"       
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 px-2"
                    disabled={deleteEssayMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation(); 
                      if (window.confirm("Are you sure you want to delete this essay? This action cannot be undone.")) {
                        deleteEssayMutation.mutate(essay.id);
                      }
                    }}
                    data-testid={`button-delete-${essay.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {essay.content.substring(0, 150)}...
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{new Date(essay.updatedAt).toLocaleDateString()}</span>
                  <span>{essay.wordCount} words</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(essay)}
                  </div>
                    {( essay.isAnalyzed) ? (
                      <Button variant="secondary" onClick={() => onViewEssay?.(essay.id)}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => onEditEssay?.(essay.id)}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
