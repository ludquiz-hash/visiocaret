import { base44 } from '@/api/base44Client';

/**
 * Ensure user has an active garage - create one if needed
 * Returns the garage ID
 */
export async function ensureActiveGarage(user) {
  if (!user?.id) {
    throw new Error('User not found');
  }

  // Check if user already has activeGarageId in their data
  if (user?.data?.activeGarageId) {
    return user.data.activeGarageId;
  }

  // Try to resolve from membership
  const garageId = await resolveActiveGarageId(user);
  if (garageId) {
    return garageId;
  }

  // Create new garage for this user
  const newGarage = await base44.entities.Garage.create({
    name: `Garage de ${user.full_name || user.email.split('@')[0]}`,
    country: 'BE',
    owner_id: user.id,
    is_active: true,
    is_subscribed: false,
    plan_type: 'starter',
    trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Create membership
  await base44.entities.GarageMember.create({
    garage_id: newGarage.id,
    user_id: user.id,
    user_email: user.email,
    user_name: user.full_name || user.email.split('@')[0],
    role: 'owner',
    is_active: true
  });

  // Persist in user data
  await base44.auth.updateMe({
    activeGarageId: newGarage.id
  });

  return newGarage.id;
}

/**
 * Resolve the active garage ID for a user
 * First checks user.data.activeGarageId, then falls back to membership lookup
 * ALSO syncs activeGarageId and activeGarageRole to user.data for RLS
 */
export async function resolveActiveGarageId(user) {
  if (!user) return null;

  let garageId = null;
  let membership = null;

  // First check if already in user data
  if (user?.data?.activeGarageId) {
    garageId = user.data.activeGarageId;
  }

  // Try membership lookup
  if (!garageId && user?.email) {
    const memberships = await base44.entities.GarageMember.filter({
      user_email: user.email,
      is_active: true
    });

    if (memberships?.length > 0) {
      membership = memberships[0];
      garageId = membership.garage_id;
    }
  }

  // Try as owner
  if (!garageId && user?.id) {
    const ownedGarages = await base44.entities.Garage.filter({
      owner_id: user.id
    });

    if (ownedGarages?.length > 0) {
      garageId = ownedGarages[0].id;
      
      // Get membership for role
      if (user?.email) {
        const memberships = await base44.entities.GarageMember.filter({
          user_email: user.email,
          garage_id: garageId
        });
        membership = memberships[0];
      }
    }
  }

  if (garageId && membership) {
    const needsSync = user.data?.activeGarageId !== garageId || user.data?.activeGarageRole !== membership.role;

    if (needsSync) {
      try {
        await base44.auth.updateMe({
          activeGarageId: garageId,
          activeGarageRole: membership.role
        });
      } catch (error) {
        // Sync will retry on next load
      }
    }
  }

  return garageId;
}