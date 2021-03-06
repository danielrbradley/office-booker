import React, { useContext, useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
import { DatePicker } from '@material-ui/pickers';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';

import { AppContext } from '../../AppProvider';

import AdminLayout from './Layout/Layout';
import Loading from '../../Assets/LoadingSpinner';
import { OurButton } from '../../../styles/MaterialComponents';

import { getOffices, createBooking, getOffice } from '../../../lib/api';
import { formatError } from '../../../lib/app';
import { OfficeSlot, OfficeWithSlots, Office } from '../../../types/api';
import { validateEmail } from '../../../lib/emailValidation';

import CreateBookingStyles from './CreateBooking.styles';

const AdminCreateBooking: React.FC<RouteComponentProps> = () => {
  // Global state
  const { state, dispatch } = useContext(AppContext);
  const { config, user } = state;

  // Local state
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState<Office[] | undefined>();
  const [selectedOffice, setSelectedOffice] = useState<Office | undefined>();
  const [selectedOfficeWithSlots, setSelectedWithSlots] = useState<OfficeWithSlots | undefined>();
  const [officeSlot, setOfficeSlot] = useState<OfficeSlot | undefined>();
  const [bookingDate, setBookingDate] = useState(addDays(new Date(), +1));
  const [email, setEmail] = useState('');
  const [parking, setParking] = useState(false);

  // Helpers
  const findOffice = useCallback(
    (name: OfficeWithSlots['name']) => offices && offices.find((o) => o.name === name),
    [offices]
  );

  // Effects
  useEffect(() => {
    if (user) {
      // Get all offices user can manage
      getOffices()
        .then((data) =>
          setOffices(
            data.filter((office) =>
              user.permissions.officesCanManageBookingsFor.find(
                (userOffice) => userOffice.name === office.name
              )
            )
          )
        )
        .catch((err) => {
          // Handle errors
          setLoading(false);

          dispatch({
            type: 'SET_ALERT',
            payload: {
              message: formatError(err),
              color: 'error',
            },
          });
        });
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user && offices && offices.length > 0 && !selectedOffice) {
      // Retrieve first office user can manage bookings for
      setSelectedOffice(findOffice(user.permissions.officesCanManageBookingsFor[0].name));
    }
  }, [user, offices, selectedOffice, findOffice]);

  useEffect(() => {
    if (selectedOffice === undefined) {
      setSelectedWithSlots(undefined);
    } else {
      setLoading(true);
      getOffice(selectedOffice.id).then((result) => {
        setLoading(false);
        setSelectedWithSlots(result);
      });
    }
  }, [selectedOffice]);

  useEffect(() => {
    if (selectedOfficeWithSlots) {
      setOfficeSlot(
        selectedOfficeWithSlots.slots.find((s) => s.date === format(bookingDate, 'yyyy-MM-dd'))
      );
    }
  }, [selectedOfficeWithSlots, bookingDate]);

  useEffect(() => {
    if (officeSlot) {
      // Wait for everything to be ready
      setLoading(false);
    }
  }, [officeSlot]);

  // Handlers
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (email === '') {
      return dispatch({
        type: 'SET_ALERT',
        payload: {
          message: 'Email address required',
          color: 'error',
        },
      });
    }

    if (!config || !validateEmail(config.emailRegex, email)) {
      return dispatch({
        type: 'SET_ALERT',
        payload: {
          message: 'Valid email address required',
          color: 'error',
        },
      });
    }

    if (!selectedOffice || !officeSlot) {
      return dispatch({
        type: 'SET_ALERT',
        payload: {
          message: 'Office required',
          color: 'error',
        },
      });
    }

    if (officeSlot.booked + 1 > selectedOffice.quota) {
      return dispatch({
        type: 'SET_ALERT',
        payload: {
          message: 'No office spaces available',
          color: 'error',
        },
      });
    }

    if (
      selectedOffice.parkingQuota > 0 &&
      parking &&
      officeSlot.bookedParking + 1 > selectedOffice.parkingQuota
    ) {
      return dispatch({
        type: 'SET_ALERT',
        payload: {
          message: 'No office parking spaces available',
          color: 'error',
        },
      });
    }

    // Submit
    const formattedDate = format(bookingDate, 'yyyy-MM-dd');

    createBooking(email, formattedDate, selectedOffice, parking)
      .then(() => {
        // Increase office quota
        // This assumes the date and selected office haven't changed
        setOfficeSlot(
          (slot) =>
            slot && {
              ...slot,
              booked: slot.booked += 1,
              bookedParking: parking ? (slot.bookedParking += 1) : slot.bookedParking,
            }
        );

        // Clear form
        setEmail('');
        setParking(false);

        // Show success alert
        dispatch({
          type: 'SET_ALERT',
          payload: {
            message: `Booking created for ${email}!`,
            color: 'success',
          },
        });
      })
      .catch((err) =>
        // Handle error
        dispatch({
          type: 'SET_ALERT',
          payload: {
            message: formatError(err),
            color: 'error',
          },
        })
      );
  };

  // Render
  if (!user) {
    return null;
  }

  return (
    <AdminLayout currentRoute="bookings">
      <CreateBookingStyles>
        {loading || !offices ? (
          <Loading />
        ) : (
          <>
            <h3>Bookings</h3>

            <Paper square className="form-container">
              <h4>New Booking</h4>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <TextField
                    id="outlined-helperText"
                    label="Email address"
                    helperText="Who is the booking for"
                    variant="outlined"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="field">
                  <FormControl variant="outlined" className="input">
                    <InputLabel id="office-label" shrink>
                      Office
                    </InputLabel>
                    <Select
                      labelId="office-label"
                      id="office"
                      value={selectedOffice?.name || ''}
                      onChange={(e) =>
                        setSelectedOffice(offices.find((o) => o.name === e.target.value))
                      }
                      label="Office"
                      required
                    >
                      {offices.map((office, index) => (
                        <MenuItem value={office.name} key={index}>
                          {office.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                {selectedOfficeWithSlots && (
                  <>
                    <div className="field">
                      <DatePicker
                        autoOk
                        disableToolbar
                        minDate={selectedOfficeWithSlots.slots[0].date}
                        maxDate={
                          selectedOfficeWithSlots.slots[selectedOfficeWithSlots.slots.length - 1]
                            .date
                        }
                        inputVariant="outlined"
                        variant="inline"
                        label="Date"
                        format="dd/MM/yyyy"
                        value={bookingDate}
                        onChange={(date) => setBookingDate(date as Date)}
                        className="input"
                      />
                    </div>

                    {officeSlot && (
                      <>
                        <div className="field bump short">
                          <p>
                            <strong>{selectedOfficeWithSlots.quota - officeSlot.booked}</strong>{' '}
                            office spaces available
                          </p>

                          {selectedOfficeWithSlots.parkingQuota > 0 && (
                            <p>
                              <strong>
                                {selectedOfficeWithSlots.parkingQuota - officeSlot.bookedParking}
                              </strong>{' '}
                              parking spaces available
                            </p>
                          )}
                        </div>

                        {selectedOfficeWithSlots.parkingQuota > 0 && (
                          <div className="field bump">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={parking}
                                  onChange={(_, checked) => setParking(checked)}
                                />
                              }
                              label="Include parking"
                              disabled={
                                selectedOfficeWithSlots.parkingQuota - officeSlot.bookedParking <= 0
                              }
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                <OurButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    !selectedOffice || !officeSlot || selectedOffice.quota - officeSlot.booked <= 0
                  }
                >
                  Create booking
                </OurButton>
              </form>
            </Paper>
          </>
        )}
      </CreateBookingStyles>
    </AdminLayout>
  );
};

export default AdminCreateBooking;
