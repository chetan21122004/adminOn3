import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-2xl px-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          On3 - Wear The Code
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Minimal. Expressive. Youth-centric streetwear for developers.
        </p>
        <Link to="/admin">
          <Button className="admin-button gap-2 text-lg px-8 py-6">
            Go to Admin Dashboard
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
