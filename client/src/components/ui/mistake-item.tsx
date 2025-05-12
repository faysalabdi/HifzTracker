import { Mistake } from "@shared/schema";
import { Edit, Trash2 } from "lucide-react";
import { mistakeTypes, getMistakeTypeColor, getMistakeTypeLabel } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface MistakeItemProps {
  mistake: Mistake;
  sessionId: number;
  onEdit?: () => void;
}

export function MistakeItem({ mistake, sessionId, onEdit }: MistakeItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const colorClasses = getMistakeTypeColor(mistake.type);
  const mistakeLabel = getMistakeTypeLabel(mistake.type);
  
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this mistake?")) {
      try {
        await apiRequest("DELETE", `/api/mistakes/${mistake.id}`);
        queryClient.invalidateQueries({ queryKey: [`/api/mistakes/session/${sessionId}`] });
        toast({
          title: "Mistake deleted",
          description: "The mistake has been removed successfully",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the mistake",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className={`flex items-center p-3 bg-opacity-5 rounded-lg ${colorClasses.split(" ")[0]}`}>
      <div className={`w-10 h-10 rounded-full bg-opacity-10 flex items-center justify-center ${colorClasses}`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-5 w-5"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div className="ml-3">
        <div className="flex items-center mb-1">
          <h4 className="font-medium">{mistakeLabel}</h4>
          <span className="ml-2 text-xs text-neutral-500">
            Page {mistake.page}, Line {mistake.line}
          </span>
        </div>
        <p className="text-sm text-neutral-600">{mistake.description}</p>
      </div>
      <div className="ml-auto">
        {onEdit && (
          <button onClick={onEdit} className="text-neutral-400 hover:text-neutral-600 mr-2">
            <Edit className="h-4 w-4" />
          </button>
        )}
        <button onClick={handleDelete} className="text-neutral-400 hover:text-error">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
