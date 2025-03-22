"use client";
import { RefreshCcw, Reply, X } from "lucide-react";

import type { Question } from "@/lib/db/queries";
import { Card, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";

export function QuestionCard({ question }: { question: Question }) {
  return (
    <Link
      href={{
        pathname: "/admin",
        query: { id: question.ticket.id },
      }}
    >
      <Card className="w-fit relative">
        <CardHeader className="px-4 mr-4 py-2">
          <CardTitle className="text-md">{question.ticket.question}</CardTitle>
          <Button
            variant="ghost"
            className="size-6 z-90 absolute top-0 right-1"
            size="icon"
            type="button"
            onClick={() => {
              console.log("delete question");
            }}
          >
            <X className="size-3" />
          </Button>
        </CardHeader>

        <CardFooter className="px-4 pb-2 gap-2 justify-between">
          <p className="text-sm text-muted-foreground">
            asked {question.userTicketCount}{" "}
            {question.userTicketCount === 1 ? "time" : "times"}
          </p>
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="size-6"
              size="icon"
              type="button"
              onClick={() => {
                console.log("refresh question");
              }}
            >
              <RefreshCcw className="size-3" />
            </Button>
            <Button
              variant="ghost"
              className="size-6"
              size="icon"
              type="button"
              onClick={() => {
                console.log("reply to question");
              }}
            >
              <Reply className="size-3" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
