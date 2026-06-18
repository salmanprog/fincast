"use client";



import type { ButtonHTMLAttributes, ReactNode } from "react";

import { usePathname } from "next/navigation";

import { openCalendlyPopup } from "@/lib/calendly";
import { useCurrentUser } from "@/utils/currentUser";



type CalendlyBookTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {

  children: ReactNode;

};



function useCalendlyBookAction() {

  const pathname = usePathname() ?? "/";

  const { user } = useCurrentUser();



  return () =>

    openCalendlyPopup(

      user ? { name: user.name, email: user.email } : undefined,

      pathname

    );

}



/** Text link styled like Footer / nav anchors — opens Calendly popup. */

export function CalendlyBookLink({

  className,

  children,

  ...props

}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {

  children: ReactNode;

}) {

  const bookCall = useCalendlyBookAction();



  return (

    <button

      type="button"

      className={className}

      {...props}

      onClick={() => bookCall()}

    >

      {children}

    </button>

  );

}



/** Reusable Book Call trigger — opens Calendly popup with existing button styles. */

export default function CalendlyBookTrigger({

  children,

  onClick,

  type = "button",

  ...props

}: CalendlyBookTriggerProps) {
  const bookCall = useCalendlyBookAction();



  return (

    <button

      type={type}

      {...props}

      onClick={(e) => {

        onClick?.(e);

        if (!e.defaultPrevented) bookCall();

      }}

    >

      {children}

    </button>

  );

}

