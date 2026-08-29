import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  UserPlus,
  Check,
  Copy,
  Share2,
  LogOut,
  Trash2,
  Siren,
  Shield,
  Truck,
  Bus,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { DriverType } from '../types/vehicle';

export const GroupsPage: React.FC = () => {
  const {
    activeGroup,
    createGroup,
    joinGroupByCode,
    addMemberToGroup,
    removeMemberFromGroup,
    leaveGroup,
    getInviteLink,
  } = useApp();

  // Create Group Form State
  const [groupName, setGroupName] = useState('Vizag Highway Fleet');
  const [initialMembers, setInitialMembers] = useState<string[]>([]);
  const [newMemberInput, setNewMemberInput] = useState('');

  // Join Group Form State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  // Active Group: Add Member Form State
  const [memberName, setMemberName] = useState('');
  const [memberVehicleType, setMemberVehicleType] = useState('Sedan Car 🚗');
  const [memberDriverType, setMemberDriverType] = useState<DriverType>('normal');
  const [memberSpeed, setMemberSpeed] = useState<number>(55);
  const [showAddForm, setShowAddForm] = useState(false);

  // Copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Create group handler
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    createGroup(groupName.trim());

    // Add any pre-entered members
    initialMembers.forEach((name) => {
      addMemberToGroup({
        name,
        driverType: name.toLowerCase().includes('medic') || name.toLowerCase().includes('ambulance') ? 'emergency' : 'normal',
        vehicleType: name.toLowerCase().includes('ambulance') ? 'Ambulance 🚑' : 'Sedan Car 🚗',
        speedKmh: Math.floor(40 + Math.random() * 30),
      });
    });
  };

  // Add initial member tag before creation
  const handleAddInitialMember = () => {
    if (!newMemberInput.trim()) return;
    if (!initialMembers.includes(newMemberInput.trim())) {
      setInitialMembers([...initialMembers, newMemberInput.trim()]);
    }
    setNewMemberInput('');
  };

  // Join group handler
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a valid group code.');
      return;
    }

    const success = joinGroupByCode(joinCodeInput.trim());
    if (!success) {
      setJoinError('Invalid group code. Please check the code and try again.');
    } else {
      setJoinError('');
      setJoinCodeInput('');
    }
  };

  // Active group: manual member add handler
  const handleAddMemberToActiveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    addMemberToGroup({
      name: memberName.trim(),
      driverType: memberDriverType,
      vehicleType: memberVehicleType,
      speedKmh: memberSpeed,
    });

    setMemberName('');
    setShowAddForm(false);
  };

  // Quick preset addition
  const handleQuickAdd = (presetName: string, vehicleType: string, driverType: DriverType, speed: number) => {
    addMemberToGroup({
      name: presetName,
      driverType,
      vehicleType,
      speedKmh: speed,
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Cooperative Fleet Network
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Fleet Groups & Member Coordination
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create a new group with a unique code & add members manually, or enter a group code to join an existing fleet.
          </p>
        </div>

        {activeGroup && (
          <button
            onClick={leaveGroup}
            className="px-4 py-2.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <LogOut className="w-4 h-4" /> Leave Current Group
          </button>
        )}
      </div>

      {activeGroup ? (
        /* ── ACTIVE GROUP VIEW ─────────────────────────────────────── */
        <div className="space-y-6">
          {/* Prominent Code Showcase Card */}
          <div className="bg-linear-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/60 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-500/30 border border-indigo-400/30 px-2.5 py-1 rounded-full">
                  ACTIVE FLEET SQUAD
                </span>
                <h2 className="text-3xl font-black tracking-tight text-white">
                  {activeGroup.name}
                </h2>
                <p className="text-xs text-indigo-200/80 max-w-md">
                  Share this unique code with other drivers to connect them to this cooperative collision safety network.
                </p>

                {/* Big Group Code Box */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-black/40 border-2 border-indigo-400/40 rounded-2xl px-4 py-2 backdrop-blur-md">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                    <span className="text-2xl font-black font-mono tracking-widest text-amber-300 select-all">
                      {activeGroup.code}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyCode(activeGroup.code)}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-indigo-200" />
                        <span>Share Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Members Count Badge */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-md p-5 rounded-3xl text-center min-w-[170px] shrink-0">
                <span className="text-[10px] uppercase font-bold text-indigo-200 block">
                  Total Fleet Members
                </span>
                <div className="text-4xl font-black text-white font-mono my-1">
                  {activeGroup.members.length}
                </div>
                <span className="text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Realtime Mesh Sync
                </span>
              </div>
            </div>
          </div>

          {/* Members Management Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Fleet Members List
                </h3>
                <p className="text-xs text-slate-500">
                  Manage all vehicles connected to this squad. You can add new drivers manually at any time.
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-100"
              >
                <UserPlus className="w-4 h-4" />
                {showAddForm ? 'Cancel Add Member' : '+ Add Member Manually'}
              </button>
            </div>

            {/* Manual Add Member Form Drawer */}
            {showAddForm && (
              <form
                onSubmit={handleAddMemberToActiveGroup}
                className="bg-slate-50 rounded-2xl p-5 border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-700">
                  <Sparkles className="w-4 h-4" /> Add Vehicle / Driver Manually
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Driver / Vehicle Name
                    </label>
                    <input
                      type="text"
                      required
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="e.g. Driver Bravo (Car Beta)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={memberVehicleType}
                      onChange={(e) => setMemberVehicleType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Sedan Car 🚗">Sedan Car 🚗</option>
                      <option value="SUV / Cruiser 🚙">SUV / Cruiser 🚙</option>
                      <option value="Ambulance 🚑">Ambulance 🚑</option>
                      <option value="Police Patrol 🚓">Police Patrol 🚓</option>
                      <option value="Heavy Truck 🚚">Heavy Truck 🚚</option>
                      <option value="Transit Bus 🚌">Transit Bus 🚌</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Driver Role / Priority
                    </label>
                    <select
                      value={memberDriverType}
                      onChange={(e) => setMemberDriverType(e.target.value as DriverType)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="normal">Normal Driver</option>
                      <option value="emergency">Emergency (High Priority)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Cruising Speed ({memberSpeed} km/h)
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      value={memberSpeed}
                      onChange={(e) => setMemberSpeed(Number(e.target.value))}
                      className="w-full mt-2 accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
                  >
                    Save & Add Member
                  </button>
                </div>
              </form>
            )}

            {/* Quick 1-Click Preset Members */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                Quick Add Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAdd('Ambulance Medic 01', 'Ambulance 🚑', 'emergency', 75)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Siren className="w-3.5 h-3.5" /> + Emergency Medic 01
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd('Police Patrol Alpha', 'Police Patrol 🚓', 'emergency', 70)}
                  className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" /> + Police Patrol
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd('Logistics Truck 04', 'Heavy Truck 🚚', 'normal', 45)}
                  className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" /> + Heavy Truck
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd('City Transit 12', 'Transit Bus 🚌', 'normal', 38)}
                  className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Bus className="w-3.5 h-3.5" /> + Transit Bus
                </button>
              </div>
            </div>

            {/* Members Cards List */}
            <div className="space-y-3">
              {activeGroup.members.map((member, index) => {
                const isHost = member.isOwner || member.name.includes('(You)') || index === 0;
                const isEmergency = member.driverType === 'emergency';

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isHost
                        ? 'border-indigo-200 bg-indigo-50/40'
                        : isEmergency
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0"
                        style={{ backgroundColor: member.color || (isHost ? '#4f46e5' : '#2563eb') }}
                      >
                        {isEmergency ? '🚑' : member.vehicleType?.includes('Truck') ? '🚚' : member.vehicleType?.includes('Bus') ? '🚌' : '🚗'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 font-black text-sm">
                            {member.name}
                          </strong>
                          {isHost && (
                            <span className="text-[10px] uppercase font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                              Host / Owner
                            </span>
                          )}
                          {isEmergency && (
                            <span className="text-[10px] uppercase font-black bg-red-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                              Emergency Priority
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{member.vehicleType || 'Vehicle'}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-slate-700">{member.speedKmh || 50} km/h</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold">● Connected</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {member.currentRiskLevel || 'SAFE'}
                      </span>

                      {!isHost && (
                        <button
                          type="button"
                          onClick={() => removeMemberFromGroup(member.id)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── CREATE / JOIN VIEW ─────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Create Group & Add Members Manually */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Create New Group
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Generate a unique shareable group code and pre-populate fleet members manually.
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Group / Fleet Name
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Highway Patrol Squad Alpha"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* Pre-add Members Manually Before Creating */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Add Initial Members Manually (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemberInput}
                      onChange={(e) => setNewMemberInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInitialMember();
                        }
                      }}
                      placeholder="e.g. Car Beta (Driver 2)"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddInitialMember}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Pre-entered Member Chips */}
                  {initialMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {initialMembers.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold"
                        >
                          🚗 {m}
                          <button
                            type="button"
                            onClick={() => setInitialMembers(initialMembers.filter((name) => name !== m))}
                            className="text-indigo-400 hover:text-indigo-700 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" /> Create Group & Generate Code
                </button>
              </form>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900">
              💡 <strong>Instant Code Generation</strong>: A random unique squad code (e.g. <span className="font-mono font-bold">UCOP-7A4B</span>) will be assigned immediately.
            </div>
          </div>

          {/* Card 2: Join Existing Group (Asks for Code) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Join Existing Group
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Have an invitation? Enter the squad group code to sync your vehicle with the fleet.
              </p>

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter Group Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={joinCodeInput}
                      onChange={(e) => {
                        setJoinCodeInput(e.target.value.toUpperCase());
                        setJoinError('');
                      }}
                      placeholder="e.g. UCOP-7F42 or 7F42"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-mono font-black text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>
                  {joinError && (
                    <p className="text-xs text-rose-600 font-bold mt-1.5">
                      {joinError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-2xl text-xs shadow-lg transition flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus className="w-4 h-4" /> Join Fleet Squad
                </button>
              </form>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600">
              🔒 <strong>Encrypted Telemetry</strong>: Joining a group allows real-time cooperative collision alerts and speed negotiation among members.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
