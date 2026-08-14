"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin, Plane } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PhotoGrid } from "@/components/PhotoGrid";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { useLibraryStore } from "@/store/library";
import { clusterTrips, reverseGeocode, type TripCluster } from "@/lib/geo";

function dateRangeLabel(start: number, end: number): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startLabel = new Date(start).toLocaleDateString(undefined, opts);
  const endLabel = new Date(end).toLocaleDateString(undefined, {
    ...opts,
    year: "numeric",
  });
  return start === end ? endLabel : `${startLabel} – ${endLabel}`;
}

function TripCard({
  trip,
  onOpen,
}: {
  trip: TripCluster & { id: string };
  onOpen: () => void;
}) {
  const [label, setLabel] = useState<string>("Locating…");
  const coverUrl = usePhotoUrl(trip.photoIds[0]);

  useEffect(() => {
    let cancelled = false;
    reverseGeocode(trip.centroid).then((result) => {
      if (!cancelled) setLabel(result ?? `${trip.centroid.lat.toFixed(1)}, ${trip.centroid.lon.toFixed(1)}`);
    });
    return () => {
      cancelled = true;
    };
  }, [trip.centroid]);

  return (
    <button
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl border border-border-soft bg-bg-card text-left transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-elevated">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={label}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="flex items-center gap-1 text-sm font-medium text-white">
            <MapPin size={13} /> {label}
          </p>
          <p className="text-xs text-white/70">{dateRangeLabel(trip.startDate, trip.endDate)}</p>
        </div>
      </div>
      <div className="px-3 py-2 text-xs text-text-faint">{trip.photoIds.length} photos</div>
    </button>
  );
}

function TravelContent() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").toLowerCase();
  const photos = useLibraryStore((s) => s.photos);
  const [openTripId, setOpenTripId] = useState<string | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});

  const trips = useMemo(() => {
    const active = photos.filter((p) => !p.trashed);
    return clusterTrips(active).map((t, i) => ({ ...t, id: `trip-${i}` }));
  }, [photos]);

  useEffect(() => {
    trips.forEach((trip) => {
      if (labels[trip.id]) return;
      reverseGeocode(trip.centroid).then((label) => {
        if (label) setLabels((prev) => ({ ...prev, [trip.id]: label }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  const filteredTrips = query
    ? trips.filter((t) => (labels[t.id] ?? "").toLowerCase().includes(query))
    : trips;

  const openTrip = trips.find((t) => t.id === openTripId);

  if (openTrip) {
    const tripPhotos = photos.filter((p) => openTrip.photoIds.includes(p.id));
    return (
      <div>
        <button
          onClick={() => setOpenTripId(null)}
          className="mb-4 flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft size={15} /> All trips
        </button>
        <PageHeader
          icon={Plane}
          title={labels[openTrip.id] ?? "Trip"}
          description={`${dateRangeLabel(openTrip.startDate, openTrip.endDate)} · ${tripPhotos.length} photos`}
        />
        <PhotoGrid photos={tripPhotos} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Plane}
        title="Travel Albums & Timelines"
        description="Photos with location data are grouped into trips by place and date — perfect for reliving your travels."
      />

      {photos.length === 0 ? (
        <EmptyState icon={Plane} title="No photos yet" description="Upload photos with location data to build travel albums." />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No trips detected"
          description="We need at least two geotagged photos taken near each other to build a trip. Most phone photos include this automatically."
        />
      ) : filteredTrips.length === 0 ? (
        <EmptyState icon={MapPin} title="No matching trips" description={`No trips found matching "${query}".`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrips
            .sort((a, b) => b.startDate - a.startDate)
            .map((trip) => (
              <TripCard key={trip.id} trip={trip} onOpen={() => setOpenTripId(trip.id)} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function TravelPage() {
  return (
    <Suspense>
      <TravelContent />
    </Suspense>
  );
}
